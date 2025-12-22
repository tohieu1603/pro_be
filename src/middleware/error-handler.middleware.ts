/**
 * Global Error Handler Middleware
 * Catches all errors and returns consistent error responses
 */

import { Request, Response, NextFunction } from "express";
import { AppError, wrapError, isOperationalError, TooManyRequestsError } from "../utils/errors";
import { logger } from "../utils/logger";

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any[];
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Not Found Handler - for undefined routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new AppError(
    `Route ${req.method} ${req.path} not found`,
    404,
    "ROUTE_NOT_FOUND"
  );
  next(error);
}

/**
 * Global Error Handler
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (req as any).requestId;
  const appError = wrapError(err);

  // Log error
  if (!isOperationalError(err)) {
    // Programming errors - log full stack trace
    logger.fatal("Unhandled error", err, {
      requestId,
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
    });
  } else if (appError.statusCode >= 500) {
    logger.error("Server error", err, { requestId });
  } else if (appError.statusCode >= 400) {
    logger.warn(`Client error: ${appError.message}`, { requestId, code: appError.code });
  }

  // Set retry-after header for rate limiting
  if (appError instanceof TooManyRequestsError) {
    res.setHeader("Retry-After", appError.retryAfter);
  }

  // Build response
  const response: ErrorResponse = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      timestamp: appError.timestamp.toISOString(),
      requestId,
    },
  };

  // Include details in non-production
  if (process.env.NODE_ENV !== "production" && appError.details) {
    response.error.details = appError.details;
  }

  res.status(appError.statusCode).json(response);
}

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Success Response Helper
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: SuccessResponse<T>["meta"]
): void {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  res.status(statusCode).json(response);
}

/**
 * Paginated Response Helper
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: { total: number; page: number; limit: number; totalPages: number }
): void {
  sendSuccess(res, data, 200, pagination);
}

/**
 * Created Response Helper
 */
export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

/**
 * No Content Response Helper
 */
export function sendNoContent(res: Response): void {
  res.status(204).send();
}
