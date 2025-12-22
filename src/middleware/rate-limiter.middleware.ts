/**
 * Rate Limiter Middleware
 * Supports multiple strategies: fixed window, sliding window, token bucket
 */

import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
  tokens?: number; // For token bucket
  lastRefill?: number;
}

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  statusCode?: number;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  handler?: (req: Request, res: Response) => void;
}

interface TokenBucketOptions {
  bucketSize: number; // Max tokens
  refillRate: number; // Tokens per second
  keyGenerator?: (req: Request) => string;
}

class RateLimiterStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

const store = new RateLimiterStore();

/**
 * Fixed Window Rate Limiter
 */
export function rateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = "Too many requests, please try again later.",
    statusCode = 429,
    keyGenerator = (req) => req.ip || "unknown",
    skip,
    handler,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip if condition met
    if (skip && skip(req)) {
      return next();
    }

    const key = `fixed:${keyGenerator(req)}`;
    const now = Date.now();
    let entry = store.get(key);

    // Reset if window expired
    if (!entry || entry.resetAt < now) {
      entry = {
        count: 0,
        resetAt: now + windowMs,
      };
    }

    entry.count++;
    store.set(key, entry);

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - entry.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

    if (entry.count > maxRequests) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));

      if (handler) {
        return handler(req, res);
      }

      return res.status(statusCode).json({
        success: false,
        message,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
    }

    next();
  };
}

/**
 * Sliding Window Rate Limiter (more accurate)
 */
export function slidingWindowLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = "Too many requests, please try again later.",
    statusCode = 429,
    keyGenerator = (req) => req.ip || "unknown",
    skip,
  } = options;

  const requests = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction) => {
    if (skip && skip(req)) {
      return next();
    }

    const key = `sliding:${keyGenerator(req)}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests and filter to current window
    let timestamps = requests.get(key) || [];
    timestamps = timestamps.filter((ts) => ts > windowStart);

    // Set headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - timestamps.length));

    if (timestamps.length >= maxRequests) {
      const oldestInWindow = timestamps[0];
      const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000);
      res.setHeader("Retry-After", retryAfter);

      return res.status(statusCode).json({
        success: false,
        message,
        retryAfter,
      });
    }

    timestamps.push(now);
    requests.set(key, timestamps);

    next();
  };
}

/**
 * Token Bucket Rate Limiter (allows bursts)
 */
export function tokenBucketLimiter(options: TokenBucketOptions) {
  const {
    bucketSize,
    refillRate,
    keyGenerator = (req) => req.ip || "unknown",
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `bucket:${keyGenerator(req)}`;
    const now = Date.now();
    let entry = store.get(key);

    if (!entry) {
      entry = {
        count: 0,
        resetAt: 0,
        tokens: bucketSize,
        lastRefill: now,
      };
    }

    // Refill tokens based on time passed
    const timePassed = (now - (entry.lastRefill || now)) / 1000;
    const tokensToAdd = timePassed * refillRate;
    entry.tokens = Math.min(bucketSize, (entry.tokens || 0) + tokensToAdd);
    entry.lastRefill = now;

    res.setHeader("X-RateLimit-Limit", bucketSize);
    res.setHeader("X-RateLimit-Remaining", Math.floor(entry.tokens || 0));

    if ((entry.tokens || 0) < 1) {
      const waitTime = Math.ceil((1 - (entry.tokens || 0)) / refillRate);
      res.setHeader("Retry-After", waitTime);

      return res.status(429).json({
        success: false,
        message: "Rate limit exceeded",
        retryAfter: waitTime,
      });
    }

    entry.tokens = (entry.tokens || 1) - 1;
    store.set(key, entry);

    next();
  };
}

/**
 * Preset rate limiters for different use cases
 * All are factory functions to avoid immediate execution
 */
export const RateLimiters = {
  // Strict: 100 requests per minute
  strict: () =>
    rateLimiter({
      windowMs: 60 * 1000,
      maxRequests: 100,
    }),

  // Standard: 1000 requests per minute
  standard: () =>
    rateLimiter({
      windowMs: 60 * 1000,
      maxRequests: 1000,
    }),

  // Relaxed: 5000 requests per minute
  relaxed: () =>
    rateLimiter({
      windowMs: 60 * 1000,
      maxRequests: 5000,
    }),

  // Auth endpoints: 10 requests per minute
  auth: () =>
    rateLimiter({
      windowMs: 60 * 1000,
      maxRequests: 10,
      message: "Too many login attempts, please try again later.",
    }),

  // API write operations: 100 per minute
  write: () =>
    rateLimiter({
      windowMs: 60 * 1000,
      maxRequests: 100,
      keyGenerator: (req) => `${req.ip || "unknown"}:${req.method}`,
    }),

  // By user ID (for authenticated requests)
  byUser: (maxRequests: number, windowMs: number) =>
    rateLimiter({
      windowMs,
      maxRequests,
      keyGenerator: (req) => (req as any).user?.id || req.ip || "unknown",
    }),
};
