import { Request, Response } from "express";
import { regionService, productRegionService } from "../services";
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendDeleted,
} from "../utils/api-response";

export class RegionController {
  /**
   * Get all regions (paginated)
   */
  async getAll(req: Request, res: Response) {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as "ASC" | "DESC") || "ASC",
      };

      const result = await regionService.findPaginatedRegions(query);
      return sendSuccess(res, result.data, undefined, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      console.error("Error fetching regions:", error);
      return sendError(res, "Failed to fetch regions", 500);
    }
  }

  /**
   * Get active regions
   */
  async getActive(req: Request, res: Response) {
    try {
      const regions = await regionService.getActiveRegions();
      return sendSuccess(res, regions);
    } catch (error) {
      return sendError(res, "Failed to fetch active regions", 500);
    }
  }

  /**
   * Get region by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const region = await regionService.findById(req.params.id);
      if (!region) {
        return sendError(res, "Region not found", 404);
      }
      return sendSuccess(res, region);
    } catch (error) {
      return sendError(res, "Failed to fetch region", 500);
    }
  }

  /**
   * Get region by slug
   */
  async getBySlug(req: Request, res: Response) {
    try {
      const region = await regionService.findBySlug(req.params.slug);
      if (!region) {
        return sendError(res, "Region not found", 404);
      }
      return sendSuccess(res, region);
    } catch (error) {
      return sendError(res, "Failed to fetch region", 500);
    }
  }

  /**
   * Get region by subdomain
   */
  async getBySubdomain(req: Request, res: Response) {
    try {
      const region = await regionService.findBySubdomain(req.params.subdomain);
      if (!region) {
        return sendError(res, "Region not found", 404);
      }
      return sendSuccess(res, region);
    } catch (error) {
      return sendError(res, "Failed to fetch region", 500);
    }
  }

  /**
   * Create region
   */
  async create(req: Request, res: Response) {
    try {
      const region = await regionService.createRegion(req.body);
      return sendCreated(res, region);
    } catch (error: any) {
      if (error.code === "DUPLICATE_SLUG" || error.code === "DUPLICATE_SUBDOMAIN") {
        return sendError(res, error.message, 400);
      }
      console.error("Error creating region:", error);
      return sendError(res, "Failed to create region", 500);
    }
  }

  /**
   * Update region
   */
  async update(req: Request, res: Response) {
    try {
      const region = await regionService.updateRegion(req.params.id, req.body);
      return sendSuccess(res, region, "Region updated successfully");
    } catch (error: any) {
      if (error.code === "DUPLICATE_SLUG" || error.code === "DUPLICATE_SUBDOMAIN") {
        return sendError(res, error.message, 400);
      }
      if (error.name === "NotFoundError") {
        return sendError(res, "Region not found", 404);
      }
      console.error("Error updating region:", error);
      return sendError(res, "Failed to update region", 500);
    }
  }

  /**
   * Delete region
   */
  async delete(req: Request, res: Response) {
    try {
      await regionService.deleteRegion(req.params.id);
      return sendDeleted(res);
    } catch (error: any) {
      if (error.code === "CANNOT_DELETE_DEFAULT") {
        return sendError(res, error.message, 400);
      }
      if (error.name === "NotFoundError") {
        return sendError(res, "Region not found", 404);
      }
      return sendError(res, "Failed to delete region", 500);
    }
  }

  /**
   * Set region as default
   */
  async setDefault(req: Request, res: Response) {
    try {
      const region = await regionService.setAsDefault(req.params.id);
      return sendSuccess(res, region, "Region set as default");
    } catch (error: any) {
      if (error.name === "NotFoundError") {
        return sendError(res, "Region not found", 404);
      }
      return sendError(res, "Failed to set default region", 500);
    }
  }

  /**
   * Get current region (from subdomain/header)
   */
  async getCurrent(req: Request, res: Response) {
    try {
      if (req.region) {
        return sendSuccess(res, req.region);
      }
      return sendError(res, "No region detected", 404);
    } catch (error) {
      return sendError(res, "Failed to get current region", 500);
    }
  }
}

export class ProductRegionController {
  /**
   * Get product-region mapping
   */
  async getByProductAndRegion(req: Request, res: Response) {
    try {
      const { productId, regionId } = req.params;
      const productRegion = await productRegionService.findByProductAndRegion(
        productId,
        regionId
      );
      if (!productRegion) {
        return sendError(res, "Product not found in this region", 404);
      }
      return sendSuccess(res, productRegion);
    } catch (error) {
      return sendError(res, "Failed to fetch product region", 500);
    }
  }

  /**
   * Get all regions for a product
   */
  async getByProduct(req: Request, res: Response) {
    try {
      const productRegions = await productRegionService.findByProduct(
        req.params.productId
      );
      return sendSuccess(res, productRegions);
    } catch (error) {
      return sendError(res, "Failed to fetch product regions", 500);
    }
  }

  /**
   * Get all products for a region
   */
  async getByRegion(req: Request, res: Response) {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };
      const result = await productRegionService.findByRegion(
        req.params.regionId,
        query
      );
      return sendSuccess(res, result.data, undefined, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      return sendError(res, "Failed to fetch region products", 500);
    }
  }

  /**
   * Create or update product-region mapping
   */
  async upsert(req: Request, res: Response) {
    try {
      const productRegion = await productRegionService.upsertProductRegion(req.body);
      return sendSuccess(res, productRegion, "Product region updated");
    } catch (error: any) {
      if (error.name === "NotFoundError") {
        return sendError(res, error.message, 404);
      }
      console.error("Error upserting product region:", error);
      return sendError(res, "Failed to update product region", 500);
    }
  }

  /**
   * Bulk update availability
   */
  async bulkUpdateAvailability(req: Request, res: Response) {
    try {
      const { regionId, productIds, isAvailable } = req.body;
      const count = await productRegionService.bulkUpdateAvailability(
        regionId,
        productIds,
        isAvailable
      );
      return sendSuccess(res, { updated: count }, `Updated ${count} products`);
    } catch (error) {
      return sendError(res, "Failed to update availability", 500);
    }
  }

  /**
   * Copy products from one region to another
   */
  async copyFromRegion(req: Request, res: Response) {
    try {
      const { sourceRegionId, targetRegionId, copyPrices } = req.body;
      const count = await productRegionService.copyFromRegion(
        sourceRegionId,
        targetRegionId,
        copyPrices
      );
      return sendSuccess(res, { copied: count }, `Copied ${count} products`);
    } catch (error) {
      return sendError(res, "Failed to copy products", 500);
    }
  }

  /**
   * Get low stock products for a region
   */
  async getLowStock(req: Request, res: Response) {
    try {
      const products = await productRegionService.getLowStockProducts(
        req.params.regionId
      );
      return sendSuccess(res, products);
    } catch (error) {
      return sendError(res, "Failed to fetch low stock products", 500);
    }
  }

  /**
   * Remove product from region
   */
  async removeFromRegion(req: Request, res: Response) {
    try {
      const { productId, regionId } = req.params;
      const result = await productRegionService.removeFromRegion(productId, regionId);
      if (!result) {
        return sendError(res, "Product not found in this region", 404);
      }
      return sendDeleted(res);
    } catch (error) {
      return sendError(res, "Failed to remove product from region", 500);
    }
  }
}

export const regionController = new RegionController();
export const productRegionController = new ProductRegionController();
