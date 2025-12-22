import { AppDataSource } from "../data-source";
import { ProductVariant, VariantStatus } from "../entities";
import { BaseService, PaginatedResult } from "./base.service";
import { VariantQuery } from "../types/query.types";
import { generateSKU } from "../utils/slug";
import { NotFoundError, BusinessErrors } from "../utils/errors";

export class ProductVariantService extends BaseService<ProductVariant> {
  protected entityName = "ProductVariant";

  constructor() {
    super(AppDataSource.getRepository(ProductVariant));
  }

  async findPaginatedVariants(
    query: VariantQuery
  ): Promise<PaginatedResult<ProductVariant>> {
    const qb = this.repository
      .createQueryBuilder("variant")
      .leftJoinAndSelect("variant.product", "product")
      .leftJoinAndSelect("variant.options", "options")
      .leftJoinAndSelect("options.optionType", "optionType")
      .leftJoinAndSelect("options.optionValue", "optionValue");

    if (query.productId) {
      qb.andWhere("variant.productId = :productId", {
        productId: query.productId,
      });
    }

    if (query.search) {
      qb.andWhere("(variant.sku ILIKE :search OR variant.name ILIKE :search)", {
        search: `%${query.search}%`,
      });
    }

    if (query.status) {
      qb.andWhere("variant.status = :status", { status: query.status });
    }

    if (query.inStock) {
      qb.andWhere("variant.stockQuantity > 0");
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    qb.skip(skip).take(limit);
    qb.orderBy("variant.createdAt", "DESC");

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createVariant(
    data: Partial<ProductVariant>,
    optionValues?: string[]
  ): Promise<ProductVariant> {
    if (!data.sku && data.productId && optionValues) {
      const product = await AppDataSource.getRepository("Product").findOne({
        where: { id: data.productId },
      });
      if (product) {
        data.sku = generateSKU((product as any).spk, optionValues);
      }
    }

    // Check for duplicate SKU
    if (data.sku) {
      const existing = await this.findOne({ sku: data.sku });
      if (existing) {
        throw BusinessErrors.DUPLICATE_SKU(data.sku);
      }
    }

    return this.create(data);
  }

  async updateVariant(id: string, data: Partial<ProductVariant>): Promise<ProductVariant> {
    const variant = await this.findById(id);
    if (!variant) {
      throw new NotFoundError(this.entityName, id);
    }

    // Check for duplicate SKU if changing
    if (data.sku && data.sku !== variant.sku) {
      const existing = await this.findOne({ sku: data.sku });
      if (existing) {
        throw BusinessErrors.DUPLICATE_SKU(data.sku);
      }
    }

    const updated = await this.update(id, data);
    return updated!;
  }

  async deleteVariant(id: string): Promise<boolean> {
    const variant = await this.findById(id);
    if (!variant) {
      throw new NotFoundError(this.entityName, id);
    }

    return this.delete(id);
  }

  async findBySKU(sku: string): Promise<ProductVariant | null> {
    return this.repository.findOne({
      where: { sku },
      relations: [
        "product",
        "options",
        "options.optionType",
        "options.optionValue",
        "inventories",
        "inventories.warehouse",
      ],
    });
  }

  async getVariantsByProduct(productId: string): Promise<ProductVariant[]> {
    return this.repository.find({
      where: { productId },
      relations: [
        "options",
        "options.optionType",
        "options.optionValue",
        "media",
      ],
      order: { isDefault: "DESC", createdAt: "ASC" },
    });
  }

  async setDefaultVariant(
    productId: string,
    variantId: string
  ): Promise<boolean> {
    // Remove default from all variants of this product
    await this.repository.update(
      { productId },
      { isDefault: false }
    );

    // Set the new default
    await this.repository.update(variantId, { isDefault: true });
    return true;
  }

  async updateStock(
    variantId: string,
    quantity: number,
    operation: "add" | "subtract" | "set"
  ): Promise<ProductVariant> {
    const variant = await this.findById(variantId);
    if (!variant) {
      throw new NotFoundError(this.entityName, variantId);
    }

    let newQuantity: number;
    switch (operation) {
      case "add":
        newQuantity = variant.stockQuantity + quantity;
        break;
      case "subtract":
        if (variant.stockQuantity < quantity) {
          throw BusinessErrors.INSUFFICIENT_STOCK(
            variant.sku,
            variant.stockQuantity,
            quantity
          );
        }
        newQuantity = variant.stockQuantity - quantity;
        break;
      case "set":
        newQuantity = quantity;
        break;
    }

    const updated = await this.update(variantId, { stockQuantity: newQuantity });
    return updated!;
  }

  async getLowStockVariants(threshold?: number): Promise<ProductVariant[]> {
    const qb = this.repository
      .createQueryBuilder("variant")
      .leftJoinAndSelect("variant.product", "product")
      .where("variant.trackInventory = true")
      .andWhere("variant.stockQuantity <= variant.lowStockThreshold");

    if (threshold !== undefined) {
      qb.andWhere("variant.stockQuantity <= :threshold", { threshold });
    }

    return qb.getMany();
  }
}

export const productVariantService = new ProductVariantService();
