import { Request, Response } from "express";
import { inventoryService } from "../services";
import { MovementType } from "../entities";
import {
  sendSuccess,
  sendError,
} from "../utils/api-response";

export class InventoryController {
  async getAll(req: Request, res: Response) {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        warehouseId: req.query.warehouseId as string,
        variantId: req.query.variantId as string,
        lowStock: req.query.lowStock === "true",
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as "ASC" | "DESC") || "DESC",
      };

      const result = await inventoryService.findPaginatedInventory(query);
      return sendSuccess(res, result.data, undefined, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      return sendError(res, "Failed to fetch inventory", 500);
    }
  }

  async getByVariant(req: Request, res: Response) {
    try {
      const inventory = await inventoryService.getInventoryByVariant(
        req.params.variantId
      );
      return sendSuccess(res, inventory);
    } catch (error) {
      return sendError(res, "Failed to fetch inventory", 500);
    }
  }

  async getByWarehouse(req: Request, res: Response) {
    try {
      const inventory = await inventoryService.getInventoryByWarehouse(
        req.params.warehouseId
      );
      return sendSuccess(res, inventory);
    } catch (error) {
      return sendError(res, "Failed to fetch inventory", 500);
    }
  }

  async getLowStock(req: Request, res: Response) {
    try {
      const warehouseId = req.query.warehouseId as string;
      const inventory = await inventoryService.getLowStockItems(warehouseId);
      return sendSuccess(res, inventory);
    } catch (error) {
      return sendError(res, "Failed to fetch low stock items", 500);
    }
  }

  async updateInventory(req: Request, res: Response) {
    try {
      const { variantId, warehouseId, quantity, type, note, createdBy } =
        req.body;

      const inventory = await inventoryService.updateInventory(
        variantId,
        warehouseId,
        quantity,
        type as MovementType,
        note,
        createdBy
      );

      return sendSuccess(res, inventory, "Inventory updated successfully");
    } catch (error) {
      console.error(error);
      return sendError(res, "Failed to update inventory", 500);
    }
  }

  async transferInventory(req: Request, res: Response) {
    try {
      const {
        variantId,
        fromWarehouseId,
        toWarehouseId,
        quantity,
        note,
        createdBy,
      } = req.body;

      const result = await inventoryService.transferInventory(
        variantId,
        fromWarehouseId,
        toWarehouseId,
        quantity,
        note,
        createdBy
      );

      return sendSuccess(res, result, "Inventory transferred successfully");
    } catch (error) {
      return sendError(res, "Failed to transfer inventory", 500);
    }
  }

  async reserveStock(req: Request, res: Response) {
    try {
      const { variantId, warehouseId, quantity } = req.body;

      const success = await inventoryService.reserveStock(
        variantId,
        warehouseId,
        quantity
      );

      if (!success) {
        return sendError(res, "Insufficient stock available", 400);
      }

      return sendSuccess(res, null, "Stock reserved successfully");
    } catch (error) {
      return sendError(res, "Failed to reserve stock", 500);
    }
  }

  async releaseReservedStock(req: Request, res: Response) {
    try {
      const { variantId, warehouseId, quantity } = req.body;

      await inventoryService.releaseReservedStock(
        variantId,
        warehouseId,
        quantity
      );

      return sendSuccess(res, null, "Reserved stock released successfully");
    } catch (error) {
      return sendError(res, "Failed to release reserved stock", 500);
    }
  }

  async getMovementHistory(req: Request, res: Response) {
    try {
      const variantId = req.query.variantId as string;
      const warehouseId = req.query.warehouseId as string;
      const limit = parseInt(req.query.limit as string) || 50;

      const movements = await inventoryService.getMovementHistory(
        variantId,
        warehouseId,
        limit
      );

      return sendSuccess(res, movements);
    } catch (error) {
      return sendError(res, "Failed to fetch movement history", 500);
    }
  }
}

export const inventoryController = new InventoryController();
