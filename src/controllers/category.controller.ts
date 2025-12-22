import { Request, Response } from "express";
import { categoryService } from "../services";
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendDeleted,
} from "../utils/api-response";

export class CategoryController {
  async getAll(req: Request, res: Response) {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as "ASC" | "DESC") || "DESC",
      };

      const result = await categoryService.findPaginatedCategories(query);
      return sendSuccess(res, result.data, undefined, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      return sendError(res, "Failed to fetch categories", 500);
    }
  }

  async getTree(req: Request, res: Response) {
    try {
      const tree = await categoryService.getCategoryTree();
      return sendSuccess(res, tree);
    } catch (error) {
      return sendError(res, "Failed to fetch category tree", 500);
    }
  }

  async getActive(req: Request, res: Response) {
    try {
      const categories = await categoryService.getActiveCategories();
      return sendSuccess(res, categories);
    } catch (error) {
      return sendError(res, "Failed to fetch active categories", 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const category = await categoryService.findById(req.params.id, [
        "parent",
        "children",
      ]);
      if (!category) {
        return sendError(res, "Category not found", 404);
      }
      return sendSuccess(res, category);
    } catch (error) {
      return sendError(res, "Failed to fetch category", 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const category = await categoryService.createCategory(req.body);
      return sendCreated(res, category);
    } catch (error: any) {
      if (error.code === "23505") {
        return sendError(res, "Category with this slug already exists", 400);
      }
      return sendError(res, "Failed to create category", 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const category = await categoryService.updateCategory(
        req.params.id,
        req.body
      );
      if (!category) {
        return sendError(res, "Category not found", 404);
      }
      return sendSuccess(res, category, "Category updated successfully");
    } catch (error: any) {
      if (error.code === "23505") {
        return sendError(res, "Category with this slug already exists", 400);
      }
      return sendError(res, "Failed to update category", 500);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deleted = await categoryService.delete(req.params.id);
      if (!deleted) {
        return sendError(res, "Category not found", 404);
      }
      return sendDeleted(res);
    } catch (error) {
      return sendError(res, "Failed to delete category", 500);
    }
  }
}

export const categoryController = new CategoryController();
