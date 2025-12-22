/**
 * Validation Middleware using class-validator
 * Supports DTOs, custom validators, and sanitization
 */

import { Request, Response, NextFunction } from "express";
import { validate, ValidationError, ValidatorOptions } from "class-validator";
import { plainToInstance, ClassConstructor } from "class-transformer";

interface ValidationPipeOptions extends ValidatorOptions {
  transform?: boolean;
  disableErrorMessages?: boolean;
  exceptionFactory?: (errors: ValidationError[]) => any;
}

/**
 * Format validation errors for API response
 */
function formatErrors(errors: ValidationError[]): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  function extractErrors(error: ValidationError, prefix = ""): void {
    const property = prefix ? `${prefix}.${error.property}` : error.property;

    if (error.constraints) {
      formatted[property] = Object.values(error.constraints);
    }

    if (error.children && error.children.length > 0) {
      error.children.forEach((child) => extractErrors(child, property));
    }
  }

  errors.forEach((error) => extractErrors(error));
  return formatted;
}

/**
 * Validation middleware factory
 */
export function validateDto<T extends object>(
  dtoClass: ClassConstructor<T>,
  options: ValidationPipeOptions = {}
) {
  const {
    transform = true,
    disableErrorMessages = false,
    whitelist = true,
    forbidNonWhitelisted = true,
    ...validatorOptions
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Transform plain object to class instance
    const dtoInstance = plainToInstance(dtoClass, req.body, {
      enableImplicitConversion: true,
      excludeExtraneousValues: whitelist,
    });

    // Validate
    const errors = await validate(dtoInstance as object, {
      whitelist,
      forbidNonWhitelisted,
      ...validatorOptions,
    });

    if (errors.length > 0) {
      const formattedErrors = disableErrorMessages ? {} : formatErrors(errors);

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formattedErrors,
      });
    }

    // Replace body with transformed instance
    if (transform) {
      req.body = dtoInstance;
    }

    next();
  };
}

/**
 * Validate query parameters
 */
export function validateQuery<T extends object>(
  dtoClass: ClassConstructor<T>,
  options: ValidationPipeOptions = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoInstance = plainToInstance(dtoClass, req.query, {
      enableImplicitConversion: true,
    });

    const errors = await validate(dtoInstance as object, {
      whitelist: true,
      ...options,
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: formatErrors(errors),
      });
    }

    req.query = dtoInstance as any;
    next();
  };
}

/**
 * Validate route parameters
 */
export function validateParams<T extends object>(
  dtoClass: ClassConstructor<T>,
  options: ValidationPipeOptions = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoInstance = plainToInstance(dtoClass, req.params, {
      enableImplicitConversion: true,
    });

    const errors = await validate(dtoInstance as object, options);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid route parameters",
        errors: formatErrors(errors),
      });
    }

    req.params = dtoInstance as any;
    next();
  };
}

/**
 * Combined validation for body, query, and params
 */
export function validateRequest<
  TBody extends object = any,
  TQuery extends object = any,
  TParams extends object = any
>(config: {
  body?: ClassConstructor<TBody>;
  query?: ClassConstructor<TQuery>;
  params?: ClassConstructor<TParams>;
  options?: ValidationPipeOptions;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const allErrors: Record<string, string[]> = {};

    // Validate body
    if (config.body) {
      const instance = plainToInstance(config.body, req.body, {
        enableImplicitConversion: true,
      });
      const errors = await validate(instance as object, config.options);
      if (errors.length > 0) {
        Object.assign(allErrors, formatErrors(errors));
      } else {
        req.body = instance;
      }
    }

    // Validate query
    if (config.query) {
      const instance = plainToInstance(config.query, req.query, {
        enableImplicitConversion: true,
      });
      const errors = await validate(instance as object, config.options);
      if (errors.length > 0) {
        const formatted = formatErrors(errors);
        Object.entries(formatted).forEach(([key, value]) => {
          allErrors[`query.${key}`] = value;
        });
      } else {
        req.query = instance as any;
      }
    }

    // Validate params
    if (config.params) {
      const instance = plainToInstance(config.params, req.params, {
        enableImplicitConversion: true,
      });
      const errors = await validate(instance as object, config.options);
      if (errors.length > 0) {
        const formatted = formatErrors(errors);
        Object.entries(formatted).forEach(([key, value]) => {
          allErrors[`params.${key}`] = value;
        });
      } else {
        req.params = instance as any;
      }
    }

    if (Object.keys(allErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: allErrors,
      });
    }

    next();
  };
}

/**
 * Simple field validators for quick inline validation
 */
export const FieldValidators = {
  isUUID: (value: string): boolean => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },

  isEmail: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  isSlug: (value: string): boolean => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(value);
  },

  isPositiveNumber: (value: number): boolean => {
    return typeof value === "number" && value > 0;
  },

  isNonNegative: (value: number): boolean => {
    return typeof value === "number" && value >= 0;
  },

  isInRange: (value: number, min: number, max: number): boolean => {
    return typeof value === "number" && value >= min && value <= max;
  },

  maxLength: (value: string, max: number): boolean => {
    return typeof value === "string" && value.length <= max;
  },

  minLength: (value: string, min: number): boolean => {
    return typeof value === "string" && value.length >= min;
  },
};

/**
 * Sanitization helpers
 */
export const Sanitizers = {
  trim: (value: string): string => value?.trim() || "",

  toLowerCase: (value: string): string => value?.toLowerCase() || "",

  toUpperCase: (value: string): string => value?.toUpperCase() || "",

  escapeHtml: (value: string): string => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
    };
    return value?.replace(/[&<>"']/g, (char) => map[char]) || "";
  },

  stripTags: (value: string): string => {
    return value?.replace(/<[^>]*>/g, "") || "";
  },

  normalizeSlug: (value: string): string => {
    return value
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "";
  },

  toNumber: (value: any): number | null => {
    const num = Number(value);
    return isNaN(num) ? null : num;
  },

  toBoolean: (value: any): boolean => {
    if (typeof value === "boolean") return value;
    if (value === "true" || value === "1") return true;
    return false;
  },

  toArray: <T>(value: T | T[]): T[] => {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null) return [];
    return [value];
  },
};
