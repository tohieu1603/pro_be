import { Request, Response } from "express";
import { productVariantService } from "../services";
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendDeleted,
} from "../utils/api-response";

export class ProductVariantController {
  async getAll(req: Request, res: Response) {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        productId: req.query.productId as string,
        status: req.query.status as string,
        inStock: req.query.inStock === "true",
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as "ASC" | "DESC") || "DESC",
      };

      const result = await productVariantService.findPaginatedVariants(query);
      return sendSuccess(res, result.data, undefined, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      return sendError(res, "Failed to fetch variants", 500);
    }
  }

  async getByProduct(req: Request, res: Response) {
    try {
      const variants = await productVariantService.getVariantsByProduct(
        req.params.productId
      );
      return sendSuccess(res, variants);
    } catch (error) {
      return sendError(res, "Failed to fetch variants", 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const variant = await productVariantService.findById(req.params.id, [
        "product",
        "options",
        "options.optionType",
        "options.optionValue",
        "inventories",
        "inventories.warehouse",
      ]);
      if (!variant) {
        return sendError(res, "Variant not found", 404);
      }
      return sendSuccess(res, variant);
    } catch (error) {
      return sendError(res, "Failed to fetch variant", 500);
    }
  }

  async getBySKU(req: Request, res: Response) {
    try {
      const variant = await productVariantService.findBySKU(req.params.sku);
      if (!variant) {
        return sendError(res, "Variant not found", 404);
      }
      return sendSuccess(res, variant);
    } catch (error) {
      return sendError(res, "Failed to fetch variant", 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { optionValues, ...variantData } = req.body;
      const variant = await productVariantService.createVariant(
        variantData,
        optionValues
      );
      return sendCreated(res, variant);
    } catch (error: any) {
      console.error(error);
      if (error.code === "23505") {
        return sendError(res, "Variant with this SKU already exists", 400);
      }
      return sendError(res, "Failed to create variant", 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const variant = await productVariantService.update(
        req.params.id,
        req.body
      );
      if (!variant) {
        return sendError(res, "Variant not found", 404);
      }
      return sendSuccess(res, variant, "Variant updated successfully");
    } catch (error: any) {
      if (error.code === "23505") {
        return sendError(res, "Variant with this SKU already exists", 400);
      }
      return sendError(res, "Failed to update variant", 500);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deleted = await productVariantService.delete(req.params.id);
      if (!deleted) {
        return sendError(res, "Variant not found", 404);
      }
      return sendDeleted(res);
    } catch (error) {
      return sendError(res, "Failed to delete variant", 500);
    }
  }

  async setDefault(req: Request, res: Response) {
    try {
      const { productId, variantId } = req.body;
      await productVariantService.setDefaultVariant(productId, variantId);
      return sendSuccess(res, null, "Default variant set successfully");
    } catch (error) {
      return sendError(res, "Failed to set default variant", 500);
    }
  }

  async updateStock(req: Request, res: Response) {
    try {
      const { quantity, operation } = req.body;
      const variant = await productVariantService.updateStock(
        req.params.id,
        quantity,
        operation
      );
      if (!variant) {
        return sendError(res, "Variant not found", 404);
      }
      return sendSuccess(res, variant, "Stock updated successfully");
    } catch (error) {
      return sendError(res, "Failed to update stock", 500);
    }
  }

  async getLowStock(req: Request, res: Response) {
    try {
      const threshold = req.query.threshold
        ? parseInt(req.query.threshold as string)
        : undefined;
      const variants = await productVariantService.getLowStockVariants(
        threshold
      );
      return sendSuccess(res, variants);
    } catch (error) {
      return sendError(res, "Failed to fetch low stock variants", 500);
    }
  }
}

export const productVariantController = new ProductVariantController();
