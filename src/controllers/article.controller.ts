import { Request, Response } from "express";
import { articleService, ArticleQuery } from "../services";
import { ArticleStatus } from "../entities";
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendDeleted,
} from "../utils/api-response";

export class ArticleController {
  async getAll(req: Request, res: Response) {
    try {
      const query: ArticleQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as "ASC" | "DESC") || "DESC",
        status: req.query.status as ArticleStatus,
        categoryId: req.query.categoryId as string,
        authorId: req.query.authorId as string,
        isFeatured: req.query.isFeatured === "true" ? true :
                    req.query.isFeatured === "false" ? false : undefined,
        tagIds: req.query.tagIds ? (req.query.tagIds as string).split(",") : undefined,
      };

      const result = await articleService.findPaginatedArticles(query);
      return sendSuccess(res, result.data, undefined, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      console.error("Error fetching articles:", error);
      return sendError(res, "Failed to fetch articles", 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const article = await articleService.findById(req.params.id, [
        "category",
        "author",
        "tags",
      ]);
      if (!article) {
        return sendError(res, "Article not found", 404);
      }
      return sendSuccess(res, article);
    } catch (error) {
      return sendError(res, "Failed to fetch article", 500);
    }
  }

  async getBySlug(req: Request, res: Response) {
    try {
      const article = await articleService.findBySlug(req.params.slug);
      if (!article) {
        return sendError(res, "Article not found", 404);
      }

      // Increment view count for published articles
      if (article.status === ArticleStatus.PUBLISHED) {
        await articleService.incrementViewCount(article.id);
      }

      return sendSuccess(res, article);
    } catch (error) {
      return sendError(res, "Failed to fetch article", 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      // Add author from authenticated user if available
      const data = {
        ...req.body,
        authorId: (req as any).user?.id || req.body.authorId,
      };

      const article = await articleService.createArticle(data);
      return sendCreated(res, article);
    } catch (error: any) {
      console.error("Error creating article:", error);
      if (error.code === "DUPLICATE_SLUG" || error.code === "23505") {
        return sendError(res, "Article with this slug already exists", 400);
      }
      return sendError(res, error.message || "Failed to create article", 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const article = await articleService.updateArticle(req.params.id, req.body);
      return sendSuccess(res, article, "Article updated successfully");
    } catch (error: any) {
      if (error.code === "DUPLICATE_SLUG" || error.code === "23505") {
        return sendError(res, "Article with this slug already exists", 400);
      }
      if (error.name === "NotFoundError") {
        return sendError(res, "Article not found", 404);
      }
      return sendError(res, error.message || "Failed to update article", 500);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deleted = await articleService.deleteArticle(req.params.id);
      if (!deleted) {
        return sendError(res, "Article not found", 404);
      }
      return sendDeleted(res);
    } catch (error: any) {
      if (error.name === "NotFoundError") {
        return sendError(res, "Article not found", 404);
      }
      return sendError(res, "Failed to delete article", 500);
    }
  }

  async publish(req: Request, res: Response) {
    try {
      const article = await articleService.publish(req.params.id);
      return sendSuccess(res, article, "Article published successfully");
    } catch (error: any) {
      if (error.name === "NotFoundError") {
        return sendError(res, "Article not found", 404);
      }
      return sendError(res, "Failed to publish article", 500);
    }
  }

  async unpublish(req: Request, res: Response) {
    try {
      const article = await articleService.unpublish(req.params.id);
      return sendSuccess(res, article, "Article unpublished successfully");
    } catch (error: any) {
      if (error.name === "NotFoundError") {
        return sendError(res, "Article not found", 404);
      }
      return sendError(res, "Failed to unpublish article", 500);
    }
  }

  async archive(req: Request, res: Response) {
    try {
      const article = await articleService.archive(req.params.id);
      return sendSuccess(res, article, "Article archived successfully");
    } catch (error: any) {
      if (error.name === "NotFoundError") {
        return sendError(res, "Article not found", 404);
      }
      return sendError(res, "Failed to archive article", 500);
    }
  }

  async getFeatured(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const articles = await articleService.getFeaturedArticles(limit);
      return sendSuccess(res, articles);
    } catch (error) {
      return sendError(res, "Failed to fetch featured articles", 500);
    }
  }

  async getRecent(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const articles = await articleService.getRecentArticles(limit);
      return sendSuccess(res, articles);
    } catch (error) {
      return sendError(res, "Failed to fetch recent articles", 500);
    }
  }

  async getByCategory(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const articles = await articleService.getArticlesByCategory(
        req.params.categoryId,
        limit
      );
      return sendSuccess(res, articles);
    } catch (error) {
      return sendError(res, "Failed to fetch articles by category", 500);
    }
  }
}

export const articleController = new ArticleController();
