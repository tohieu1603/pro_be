import { Request, Response } from "express";
import { authService } from "../services";
import { sendSuccess, sendError, sendCreated } from "../utils/api-response";

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return sendError(res, "Email, password and name are required", 400);
      }

      if (password.length < 6) {
        return sendError(res, "Password must be at least 6 characters", 400);
      }

      const user = await authService.register(email, password, name);
      return sendCreated(res, user, "Registration successful");
    } catch (error: any) {
      if (error.code === "EMAIL_EXISTS") {
        return sendError(res, error.message, 400);
      }
      return sendError(res, "Registration failed", 500);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return sendError(res, "Email and password are required", 400);
      }

      const { user, tokens } = await authService.login(email, password);
      return sendSuccess(res, {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }, "Login successful");
    } catch (error: any) {
      if (error.statusCode === 401) {
        return sendError(res, error.message, 401);
      }
      return sendError(res, "Login failed", 500);
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return sendError(res, "Refresh token is required", 400);
      }

      const { accessToken } = await authService.refreshAccessToken(refreshToken);
      return sendSuccess(res, { accessToken }, "Token refreshed");
    } catch (error: any) {
      if (error.statusCode === 401) {
        return sendError(res, error.message, 401);
      }
      return sendError(res, "Token refresh failed", 500);
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      return sendSuccess(res, null, "Logged out successfully");
    } catch (error) {
      return sendError(res, "Logout failed", 500);
    }
  }

  async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, "Not authenticated", 401);
      }

      const user = await authService.getMe(req.user.userId);
      return sendSuccess(res, user);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return sendError(res, "User not found", 404);
      }
      return sendError(res, "Failed to get user", 500);
    }
  }
}

export const authController = new AuthController();
