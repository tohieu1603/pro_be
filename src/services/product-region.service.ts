import { In } from "typeorm";
import { AppDataSource } from "../data-source";
import { ProductRegion, Product, Region } from "../entities";
import { BaseService, PaginatedResult } from "./base.service";
import { PaginationQuery } from "../types/query.types";
import { NotFoundError, BusinessError } from "../utils/errors";
import { getRegionPrice, RegionPriceInfo } from "../utils/multi-tenant";

export interface CreateProductRegionDTO {
  productId: string;
  regionId: string;
  price?: number;
  compareAtPrice?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  isAvailable?: boolean;
  promotionText?: string;
  shippingNote?: string;
  deliveryDays?: number;
}

export interface ProductWithRegionPrice {
  product: Product;
  regionPrice: RegionPriceInfo;
}

export class ProductRegionService extends BaseService<ProductRegion> {
  protected entityName = "ProductRegion";

  constructor() {
    super(AppDataSource.getRepository(ProductRegion));
  }

  /**
   * Get product-region mapping
   */
  async findByProductAndRegion(
    productId: string,
    regionId: string
  ): Promise<ProductRegion | null> {
    return this.findOne({ productId, regionId });
  }

  /**
   * Get all regions for a product
   */
  async findByProduct(productId: string): Promise<ProductRegion[]> {
    return this.findAll({
      where: { productId },
      relations: ["region"],
      order: { createdAt: "ASC" },
    });
  }

  /**
   * Get all products for a region
   */
  async findByRegion(
    regionId: string,
    query?: PaginationQuery
  ): Promise<PaginatedResult<ProductRegion>> {
    const page = query?.page || 1;
    const limit = query?.limit || 10;

    return this.findPaginated(
      { page, limit },
      { regionId, isAvailable: true },
      ["product", "product.brand", "product.category", "product.media"]
    );
  }

  /**
   * Create or update product-region mapping
   */
  async upsertProductRegion(data: CreateProductRegionDTO): Promise<ProductRegion> {
    const existing = await this.findByProductAndRegion(data.productId, data.regionId);

    if (existing) {
      const updated = await this.update(existing.id, data);
      return updated!;
    }

    // Verify product exists
    const productRepo = AppDataSource.getRepository(Product);
    const product = await productRepo.findOne({ where: { id: data.productId } });
    if (!product) {
      throw new NotFoundError("Product", data.productId);
    }

    // Verify region exists
    const regionRepo = AppDataSource.getRepository(Region);
    const region = await regionRepo.findOne({ where: { id: data.regionId } });
    if (!region) {
      throw new NotFoundError("Region", data.regionId);
    }

    return this.create({
      ...data,
      stockQuantity: data.stockQuantity ?? 0,
      lowStockThreshold: data.lowStockThreshold ?? 5,
      isAvailable: data.isAvailable ?? true,
    });
  }

  /**
   * Bulk update product availability for a region
   */
  async bulkUpdateAvailability(
    regionId: string,
    productIds: string[],
    isAvailable: boolean
  ): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update()
      .set({ isAvailable })
      .where("region_id = :regionId", { regionId })
      .andWhere("product_id IN (:...productIds)", { productIds })
      .execute();

    return result.affected ?? 0;
  }

  /**
   * Bulk update prices for a region (percentage adjustment)
   */
  async bulkAdjustPrices(
    regionId: string,
    adjustmentPercent: number
  ): Promise<number> {
    // Get all product regions for this region
    const productRegions = await this.findAll({
      where: { regionId },
      relations: ["product"],
    });

    let updated = 0;
    for (const pr of productRegions) {
      const basePrice = pr.price ?? Number(pr.product?.basePrice ?? 0);
      if (basePrice > 0) {
        const newPrice = Math.round(basePrice * (1 + adjustmentPercent / 100));
        await this.update(pr.id, { price: newPrice });
        updated++;
      }
    }

    return updated;
  }

  /**
   * Copy product availability from one region to another
   */
  async copyFromRegion(
    sourceRegionId: string,
    targetRegionId: string,
    copyPrices = false
  ): Promise<number> {
    const sourceProducts = await this.findAll({
      where: { regionId: sourceRegionId },
    });

    let created = 0;
    for (const source of sourceProducts) {
      const existing = await this.findByProductAndRegion(
        source.productId,
        targetRegionId
      );

      if (!existing) {
        await this.create({
          productId: source.productId,
          regionId: targetRegionId,
          price: copyPrices ? source.price : undefined,
          compareAtPrice: copyPrices ? source.compareAtPrice : undefined,
          stockQuantity: 0,
          lowStockThreshold: source.lowStockThreshold,
          isAvailable: source.isAvailable,
        });
        created++;
      }
    }

    return created;
  }

  /**
   * Get products with region-specific pricing
   */
  async getProductsWithRegionPricing(
    regionId: string,
    productIds: string[]
  ): Promise<Map<string, ProductRegion>> {
    const productRegions = await this.findAll({
      where: {
        regionId,
        productId: In(productIds),
      },
    });

    const map = new Map<string, ProductRegion>();
    productRegions.forEach((pr) => {
      map.set(pr.productId, pr);
    });

    return map;
  }

  /**
   * Get low stock products for a region
   */
  async getLowStockProducts(regionId: string): Promise<ProductRegion[]> {
    return this.repository
      .createQueryBuilder("pr")
      .leftJoinAndSelect("pr.product", "product")
      .leftJoinAndSelect("product.brand", "brand")
      .where("pr.region_id = :regionId", { regionId })
      .andWhere("pr.is_available = true")
      .andWhere("pr.stock_quantity <= pr.low_stock_threshold")
      .orderBy("pr.stock_quantity", "ASC")
      .getMany();
  }

  /**
   * Delete product from region
   */
  async removeFromRegion(productId: string, regionId: string): Promise<boolean> {
    const existing = await this.findByProductAndRegion(productId, regionId);
    if (!existing) {
      return false;
    }
    return this.delete(existing.id);
  }
}

export const productRegionService = new ProductRegionService();
