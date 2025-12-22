import { Request, Response } from "express";
import { brandService } from "../services";
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendDeleted,
} from "../utils/api-response";

export class BrandController {
  async getAll(req: Request, res: Response) {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as "ASC" | "DESC") || "DESC",
      };

      const result = await brandService.findPaginatedBrands(query);
      return sendSuccess(res, result.data, undefined, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      return sendError(res, "Failed to fetch brands", 500);
    }
  }

  async getActive(req: Request, res: Response) {
    try {
      const brands = await brandService.getActiveBrands();
      return sendSuccess(res, brands);
    } catch (error) {
      return sendError(res, "Failed to fetch active brands", 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const brand = await brandService.findById(req.params.id);
      if (!brand) {
        return sendError(res, "Brand not found", 404);
      }
      return sendSuccess(res, brand);
    } catch (error) {
      return sendError(res, "Failed to fetch brand", 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const brand = await brandService.createBrand(req.body);
      return sendCreated(res, brand);
    } catch (error: any) {
      if (error.code === "23505") {
        return sendError(res, "Brand with this slug already exists", 400);
      }
      return sendError(res, "Failed to create brand", 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const brand = await brandService.updateBrand(req.params.id, req.body);
      if (!brand) {
        return sendError(res, "Brand not found", 404);
      }
      return sendSuccess(res, brand, "Brand updated successfully");
    } catch (error: any) {
      if (error.code === "23505") {
        return sendError(res, "Brand with this slug already exists", 400);
      }
      return sendError(res, "Failed to update brand", 500);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deleted = await brandService.delete(req.params.id);
      if (!deleted) {
        return sendError(res, "Brand not found", 404);
      }
      return sendDeleted(res);
    } catch (error) {
      return sendError(res, "Failed to delete brand", 500);
    }
  }
}

export const brandController = new BrandController();
