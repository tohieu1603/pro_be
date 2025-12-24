import { Request, Response } from "express";
import { productService, promotionService, serviceInfoService } from "../services";
import {
  sendSuccess,
  sendError,
  sendCreated,
  sendDeleted,
} from "../utils/api-response";

export class ProductController {
  async getAll(req: Request, res: Response) {
    try {
      const query = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        categoryId: req.query.categoryId as string,
        brandId: req.query.brandId as string,
        status: req.query.status as string,
        isFeatured: req.query.isFeatured !== undefined ? req.query.isFeatured === "true" : undefined,
        minPrice: req.query.minPrice
          ? parseFloat(req.query.minPrice as string)
          : undefined,
        maxPrice: req.query.maxPrice
          ? parseFloat(req.query.maxPrice as string)
          : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as "ASC" | "DESC") || "DESC",
      };

      const result = await productService.findPaginatedProducts(query);
      return sendSuccess(res, result.data, undefined, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      console.error(error);
      return sendError(res, "Failed to fetch products", 500);
    }
  }

  async getFeatured(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const products = await productService.getFeaturedProducts(limit);
      return sendSuccess(res, products);
    } catch (error) {
      return sendError(res, "Failed to fetch featured products", 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const product = await productService.getProductWithFullDetails(
        req.params.id
      );
      if (!product) {
        return sendError(res, "Product not found", 404);
      }
      return sendSuccess(res, product);
    } catch (error) {
      return sendError(res, "Failed to fetch product", 500);
    }
  }

  async getBySlug(req: Request, res: Response) {
    try {
      const product = await productService.findBySlug(req.params.slug);
      if (!product) {
        return sendError(res, "Product not found", 404);
      }
      return sendSuccess(res, product);
    } catch (error) {
      return sendError(res, "Failed to fetch product", 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const product = await productService.createProduct(req.body);
      return sendCreated(res, product);
    } catch (error: any) {
      console.error(error);
      if (error.code === "23505") {
        return sendError(
          res,
          "Product with this slug or SPK already exists",
          400
        );
      }
      return sendError(res, "Failed to create product", 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const product = await productService.updateProduct(
        req.params.id,
        req.body
      );
      if (!product) {
        return sendError(res, "Product not found", 404);
      }
      return sendSuccess(res, product, "Product updated successfully");
    } catch (error: any) {
      if (error.code === "23505") {
        return sendError(
          res,
          "Product with this slug or SPK already exists",
          400
        );
      }
      return sendError(res, "Failed to update product", 500);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deleted = await productService.delete(req.params.id);
      if (!deleted) {
        return sendError(res, "Product not found", 404);
      }
      return sendDeleted(res);
    } catch (error) {
      return sendError(res, "Failed to delete product", 500);
    }
  }

  async publish(req: Request, res: Response) {
    try {
      const product = await productService.publishProduct(req.params.id);
      if (!product) {
        return sendError(res, "Product not found", 404);
      }
      return sendSuccess(res, product, "Product published successfully");
    } catch (error) {
      return sendError(res, "Failed to publish product", 500);
    }
  }

  async unpublish(req: Request, res: Response) {
    try {
      const product = await productService.unpublishProduct(req.params.id);
      if (!product) {
        return sendError(res, "Product not found", 404);
      }
      return sendSuccess(res, product, "Product unpublished successfully");
    } catch (error) {
      return sendError(res, "Failed to unpublish product", 500);
    }
  }

  async updateTags(req: Request, res: Response) {
    try {
      const { tagIds } = req.body;
      const product = await productService.updateProductTags(
        req.params.id,
        tagIds
      );
      if (!product) {
        return sendError(res, "Product not found", 404);
      }
      return sendSuccess(res, product, "Product tags updated successfully");
    } catch (error) {
      return sendError(res, "Failed to update product tags", 500);
    }
  }

  async getPromotions(req: Request, res: Response) {
    try {
      const productId = req.params.id;
      const product = await productService.findById(productId);
      if (!product) {
        return sendError(res, "Product not found", 404);
      }
      const promotions = await promotionService.getPromotionsForProduct(
        productId,
        product.categoryId,
        product.brandId
      );
      return sendSuccess(res, promotions);
    } catch (error) {
      return sendError(res, "Failed to fetch promotions", 500);
    }
  }

  async getServices(req: Request, res: Response) {
    try {
      const productId = req.params.id;
      const product = await productService.findById(productId);
      if (!product) {
        return sendError(res, "Product not found", 404);
      }
      const services = await serviceInfoService.getServicesForProduct(
        productId,
        product.categoryId,
        product.brandId
      );
      return sendSuccess(res, services);
    } catch (error) {
      return sendError(res, "Failed to fetch services", 500);
    }
  }

  async getAllPromotions(req: Request, res: Response) {
    try {
      const promotions = await promotionService.getActivePromotions();
      return sendSuccess(res, promotions);
    } catch (error) {
      return sendError(res, "Failed to fetch promotions", 500);
    }
  }

  async getAllServices(req: Request, res: Response) {
    try {
      const services = await serviceInfoService.getActiveServices();
      return sendSuccess(res, services);
    } catch (error) {
      return sendError(res, "Failed to fetch services", 500);
    }
  }

  async updateMedia(req: Request, res: Response) {
    try {
      const { media } = req.body;
      if (!Array.isArray(media)) {
        return sendError(res, "Media must be an array", 400);
      }

      const savedMedia = await productService.updateProductMedia(
        req.params.id,
        media
      );
      return sendSuccess(res, savedMedia, "Product media updated successfully");
    } catch (error: any) {
      if (error.name === "NotFoundError") {
        return sendError(res, error.message, 404);
      }
      return sendError(res, "Failed to update product media", 500);
    }
  }
}

export const productController = new ProductController();
