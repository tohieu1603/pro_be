/**
 * Custom Error Classes
 * Structured errors with HTTP status codes and error codes
 */

export interface ErrorDetails {
  field?: string;
  value?: any;
  constraint?: string;
  [key: string]: any;
}

/**
 * Base Application Error
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: ErrorDetails[];
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: ErrorDetails[],
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp.toISOString(),
      },
    };
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends AppError {
  constructor(message: string = "Bad request", details?: ErrorDetails[]) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(resource: string = "Resource", id?: string) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(message, 404, "NOT_FOUND", [{ resource, id }]);
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists", details?: ErrorDetails[]) {
    super(message, 409, "CONFLICT", details);
  }
}

/**
 * 422 Validation Error
 */
export class ValidationError extends AppError {
  constructor(message: string = "Validation failed", details?: ErrorDetails[]) {
    super(message, 422, "VALIDATION_ERROR", details);
  }
}

/**
 * 429 Too Many Requests
 */
export class TooManyRequestsError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter: number = 60) {
    super(`Too many requests. Retry after ${retryAfter} seconds`, 429, "RATE_LIMIT_EXCEEDED");
    this.retryAfter = retryAfter;
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalError extends AppError {
  constructor(message: string = "Internal server error") {
    super(message, 500, "INTERNAL_ERROR", undefined, false);
  }
}

/**
 * 503 Service Unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = "Service temporarily unavailable") {
    super(message, 503, "SERVICE_UNAVAILABLE");
  }
}

/**
 * Database Error
 */
export class DatabaseError extends AppError {
  constructor(message: string = "Database operation failed", originalError?: Error) {
    super(message, 500, "DATABASE_ERROR", undefined, false);
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

/**
 * Business Logic Error
 */
export class BusinessError extends AppError {
  constructor(message: string, code: string = "BUSINESS_ERROR", details?: ErrorDetails[]) {
    super(message, 400, code, details);
  }
}

// Common business errors
export const BusinessErrors = {
  INSUFFICIENT_STOCK: (sku: string, available: number, requested: number) =>
    new BusinessError(
      `Insufficient stock for ${sku}. Available: ${available}, Requested: ${requested}`,
      "INSUFFICIENT_STOCK",
      [{ sku, available, requested }]
    ),

  INVALID_PRICE: (reason: string) =>
    new BusinessError(`Invalid price: ${reason}`, "INVALID_PRICE"),

  DUPLICATE_SKU: (sku: string) =>
    new ConflictError(`SKU ${sku} already exists`, [{ field: "sku", value: sku }]),

  DUPLICATE_SLUG: (slug: string) =>
    new ConflictError(`Slug ${slug} already exists`, [{ field: "slug", value: slug }]),

  CATEGORY_HAS_PRODUCTS: (categoryId: string) =>
    new BusinessError(
      "Cannot delete category with associated products",
      "CATEGORY_HAS_PRODUCTS",
      [{ categoryId }]
    ),

  WAREHOUSE_HAS_INVENTORY: (warehouseId: string) =>
    new BusinessError(
      "Cannot delete warehouse with inventory",
      "WAREHOUSE_HAS_INVENTORY",
      [{ warehouseId }]
    ),

  INVALID_TRANSFER: (reason: string) =>
    new BusinessError(`Invalid transfer: ${reason}`, "INVALID_TRANSFER"),
};

/**
 * Check if error is operational (expected) or programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Wrap unknown errors
 */
export function wrapError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for TypeORM errors
    if (error.name === "QueryFailedError") {
      const pgError = error as any;

      // Unique constraint violation
      if (pgError.code === "23505") {
        return new ConflictError("Resource already exists", [
          { constraint: pgError.constraint, detail: pgError.detail },
        ]);
      }

      // Foreign key violation
      if (pgError.code === "23503") {
        return new BadRequestError("Referenced resource does not exist", [
          { constraint: pgError.constraint, detail: pgError.detail },
        ]);
      }

      // Not null violation
      if (pgError.code === "23502") {
        return new ValidationError("Required field is missing", [
          { field: pgError.column },
        ]);
      }

      return new DatabaseError(error.message, error);
    }

    // Entity not found
    if (error.name === "EntityNotFoundError") {
      return new NotFoundError("Resource");
    }

    return new InternalError(error.message);
  }

  return new InternalError("An unexpected error occurred");
}
