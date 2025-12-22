import { Request, Response } from "express";
import { userService } from "../services";
import { sendSuccess, sendError, sendCreated, sendDeleted } from "../utils/api-response";

export class UserController {
  async getAll(req: Request, res: Response) {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as "ASC" | "DESC") || "DESC",
      };

      const result = await userService.findPaginatedUsers(query);
      return sendSuccess(res, result.data, undefined, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      return sendError(res, "Failed to fetch users", 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const user = await userService.findById(req.params.id);
      if (!user) {
        return sendError(res, "User not found", 404);
      }
      return sendSuccess(res, user);
    } catch (error) {
      return sendError(res, "Failed to fetch user", 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name) {
        return sendError(res, "Email, password and name are required", 400);
      }

      if (password.length < 6) {
        return sendError(res, "Password must be at least 6 characters", 400);
      }

      const user = await userService.createUser({ email, password, name, role });
      return sendCreated(res, user, "User created successfully");
    } catch (error: any) {
      if (error.code === "EMAIL_EXISTS") {
        return sendError(res, error.message, 400);
      }
      return sendError(res, "Failed to create user", 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      return sendSuccess(res, user, "User updated successfully");
    } catch (error: any) {
      if (error.statusCode === 404) {
        return sendError(res, error.message, 404);
      }
      if (error.code === "EMAIL_EXISTS") {
        return sendError(res, error.message, 400);
      }
      return sendError(res, "Failed to update user", 500);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await userService.deleteUser(req.params.id);
      return sendDeleted(res);
    } catch (error: any) {
      if (error.statusCode === 404) {
        return sendError(res, error.message, 404);
      }
      if (error.code === "LAST_ADMIN") {
        return sendError(res, error.message, 400);
      }
      return sendError(res, "Failed to delete user", 500);
    }
  }

  async toggleActive(req: Request, res: Response) {
    try {
      const user = await userService.toggleActive(req.params.id);
      return sendSuccess(res, user, "User status updated");
    } catch (error: any) {
      if (error.statusCode === 404) {
        return sendError(res, error.message, 404);
      }
      if (error.code === "LAST_ADMIN") {
        return sendError(res, error.message, 400);
      }
      return sendError(res, "Failed to toggle user status", 500);
    }
  }
}

export const userController = new UserController();
