import { Request, Response } from "express";
import { articleCategoryService } from "../services";
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendDeleted,
} from "../utils/api-response";

export class ArticleCategoryController {
  async getAll(req: Request, res: Response) {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as "ASC" | "DESC") || "DESC",
      };

      const result = await articleCategoryService.findPaginatedCategories(query);
      return sendSuccess(res, result.data, undefined, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      return sendError(res, "Failed to fetch article categories", 500);
    }
  }

  async getTree(req: Request, res: Response) {
    try {
      const tree = await articleCategoryService.getCategoryTree();
      return sendSuccess(res, tree);
    } catch (error) {
      return sendError(res, "Failed to fetch article category tree", 500);
    }
  }

  async getActive(req: Request, res: Response) {
    try {
      const categories = await articleCategoryService.getActiveCategories();
      return sendSuccess(res, categories);
    } catch (error) {
      return sendError(res, "Failed to fetch active article categories", 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const category = await articleCategoryService.findById(req.params.id, [
        "parent",
        "children",
      ]);
      if (!category) {
        return sendError(res, "Article category not found", 404);
      }
      return sendSuccess(res, category);
    } catch (error) {
      return sendError(res, "Failed to fetch article category", 500);
    }
  }

  async getBySlug(req: Request, res: Response) {
    try {
      const category = await articleCategoryService.findBySlug(req.params.slug);
      if (!category) {
        return sendError(res, "Article category not found", 404);
      }
      return sendSuccess(res, category);
    } catch (error) {
      return sendError(res, "Failed to fetch article category", 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const category = await articleCategoryService.createCategory(req.body);
      return sendCreated(res, category);
    } catch (error: any) {
      if (error.code === "DUPLICATE_SLUG" || error.code === "23505") {
        return sendError(res, "Article category with this slug already exists", 400);
      }
      return sendError(res, "Failed to create article category", 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const category = await articleCategoryService.updateCategory(
        req.params.id,
        req.body
      );
      if (!category) {
        return sendError(res, "Article category not found", 404);
      }
      return sendSuccess(res, category, "Article category updated successfully");
    } catch (error: any) {
      if (error.code === "DUPLICATE_SLUG" || error.code === "23505") {
        return sendError(res, "Article category with this slug already exists", 400);
      }
      return sendError(res, "Failed to update article category", 500);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deleted = await articleCategoryService.deleteCategory(req.params.id);
      if (!deleted) {
        return sendError(res, "Article category not found", 404);
      }
      return sendDeleted(res);
    } catch (error: any) {
      if (error.code === "CATEGORY_HAS_ARTICLES") {
        return sendError(res, error.message, 400);
      }
      return sendError(res, "Failed to delete article category", 500);
    }
  }
}

export const articleCategoryController = new ArticleCategoryController();
