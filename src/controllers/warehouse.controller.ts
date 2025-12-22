import { Request, Response } from "express";
import { warehouseService } from "../services";
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendDeleted,
} from "../utils/api-response";

export class WarehouseController {
  async getAll(req: Request, res: Response) {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as "ASC" | "DESC") || "DESC",
      };

      const result = await warehouseService.findPaginatedWarehouses(query);
      return sendSuccess(res, result.data, undefined, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      return sendError(res, "Failed to fetch warehouses", 500);
    }
  }

  async getActive(req: Request, res: Response) {
    try {
      const warehouses = await warehouseService.getActiveWarehouses();
      return sendSuccess(res, warehouses);
    } catch (error) {
      return sendError(res, "Failed to fetch active warehouses", 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const warehouse = await warehouseService.findById(req.params.id);
      if (!warehouse) {
        return sendError(res, "Warehouse not found", 404);
      }
      return sendSuccess(res, warehouse);
    } catch (error) {
      return sendError(res, "Failed to fetch warehouse", 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const warehouse = await warehouseService.create(req.body);
      return sendCreated(res, warehouse);
    } catch (error: any) {
      if (error.code === "23505") {
        return sendError(res, "Warehouse with this code already exists", 400);
      }
      return sendError(res, "Failed to create warehouse", 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const warehouse = await warehouseService.update(req.params.id, req.body);
      if (!warehouse) {
        return sendError(res, "Warehouse not found", 404);
      }
      return sendSuccess(res, warehouse, "Warehouse updated successfully");
    } catch (error: any) {
      if (error.code === "23505") {
        return sendError(res, "Warehouse with this code already exists", 400);
      }
      return sendError(res, "Failed to update warehouse", 500);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deleted = await warehouseService.delete(req.params.id);
      if (!deleted) {
        return sendError(res, "Warehouse not found", 404);
      }
      return sendDeleted(res);
    } catch (error) {
      return sendError(res, "Failed to delete warehouse", 500);
    }
  }
}

export const warehouseController = new WarehouseController();
