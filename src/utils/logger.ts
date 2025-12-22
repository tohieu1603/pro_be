/**
 * Logger Service
 * Structured logging with levels, context, and formatting
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogContext {
  requestId?: string;
  userId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const LOG_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m", // Cyan
  info: "\x1b[32m", // Green
  warn: "\x1b[33m", // Yellow
  error: "\x1b[31m", // Red
  fatal: "\x1b[35m", // Magenta
};

const RESET = "\x1b[0m";

class Logger {
  private minLevel: LogLevel;
  private useColors: boolean;
  private useJson: boolean;

  constructor() {
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || "info";
    this.useColors = process.env.NODE_ENV !== "production";
    this.useJson = process.env.LOG_FORMAT === "json";
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(entry: LogEntry): string {
    if (this.useJson) {
      return JSON.stringify(entry);
    }

    const { timestamp, level, message, context, error } = entry;
    const color = this.useColors ? LOG_COLORS[level] : "";
    const reset = this.useColors ? RESET : "";

    let output = `${timestamp} ${color}[${level.toUpperCase()}]${reset} ${message}`;

    if (context && Object.keys(context).length > 0) {
      const contextStr = Object.entries(context)
        .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`)
        .join(" ");
      output += ` | ${contextStr}`;
    }

    if (error) {
      output += `\n  Error: ${error.name}: ${error.message}`;
      if (error.stack && this.minLevel === "debug") {
        output += `\n  Stack: ${error.stack}`;
      }
    }

    return output;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const output = this.formatMessage(entry);

    if (level === "error" || level === "fatal") {
      console.error(output);
    } else if (level === "warn") {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log("error", message, context, error);
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    this.log("fatal", message, context, error);
  }

  // Request logging helper
  request(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    const level: LogLevel = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
    this.log(level, `${method} ${path} (${duration}ms)`, {
      ...context,
      method,
      path,
      statusCode,
      duration,
    });
  }

  // Create child logger with preset context
  child(defaultContext: LogContext): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private defaultContext: LogContext
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.defaultContext, ...context };
  }

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context));
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.parent.error(message, error, this.mergeContext(context));
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    this.parent.fatal(message, error, this.mergeContext(context));
  }
}

// Singleton instance
export const logger = new Logger();

// Express middleware for request logging
import { Request, Response, NextFunction } from "express";

export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const requestId = req.headers["x-request-id"] as string || generateRequestId();

    // Attach request ID to request object
    (req as any).requestId = requestId;
    res.setHeader("x-request-id", requestId);

    // Log on response finish
    res.on("finish", () => {
      const duration = Date.now() - start;
      logger.request(req.method, req.path, res.statusCode, duration, {
        requestId,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      });
    });

    next();
  };
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
