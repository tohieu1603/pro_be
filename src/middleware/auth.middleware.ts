import { Request, Response, NextFunction } from "express";
import { authService, JwtPayload } from "../services/auth.service";
import { UserRole } from "../entities";
import { sendError } from "../utils/api-response";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, "No token provided", 401);
  }

  const token = authHeader.substring(7);

  try {
    const payload = authService.validateAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return sendError(res, "Invalid or expired token", 401);
  }
};

/**
 * Middleware to authorize specific roles
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, "Not authenticated", 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, "Access denied. Insufficient permissions", 403);
    }

    next();
  };
};

/**
 * Combined middleware: authenticate + authorize admin
 */
export const adminOnly = [authenticate, authorize(UserRole.ADMIN)];
