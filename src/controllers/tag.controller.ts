import { Request, Response } from "express";
import { tagService } from "../services";
import { TagType } from "../entities";
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendDeleted,
} from "../utils/api-response";

export class TagController {
  async getAll(req: Request, res: Response) {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        type: req.query.type as TagType,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as "ASC" | "DESC") || "DESC",
      };

      const result = await tagService.findPaginatedTags(query);
      return sendSuccess(res, result.data, undefined, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      return sendError(res, "Failed to fetch tags", 500);
    }
  }

  async getByType(req: Request, res: Response) {
    try {
      const tags = await tagService.getTagsByType(req.params.type as TagType);
      return sendSuccess(res, tags);
    } catch (error) {
      return sendError(res, "Failed to fetch tags", 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const tag = await tagService.findById(req.params.id);
      if (!tag) {
        return sendError(res, "Tag not found", 404);
      }
      return sendSuccess(res, tag);
    } catch (error) {
      return sendError(res, "Failed to fetch tag", 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const tag = await tagService.createTag(req.body);
      return sendCreated(res, tag);
    } catch (error: any) {
      if (error.code === "23505") {
        return sendError(res, "Tag with this slug already exists", 400);
      }
      return sendError(res, "Failed to create tag", 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const tag = await tagService.updateTag(req.params.id, req.body);
      if (!tag) {
        return sendError(res, "Tag not found", 404);
      }
      return sendSuccess(res, tag, "Tag updated successfully");
    } catch (error: any) {
      if (error.code === "23505") {
        return sendError(res, "Tag with this slug already exists", 400);
      }
      return sendError(res, "Failed to update tag", 500);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deleted = await tagService.delete(req.params.id);
      if (!deleted) {
        return sendError(res, "Tag not found", 404);
      }
      return sendDeleted(res);
    } catch (error) {
      return sendError(res, "Failed to delete tag", 500);
    }
  }
}

export const tagController = new TagController();
