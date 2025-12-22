import { In } from "typeorm";
import { AppDataSource } from "../data-source";
import { Product, ProductStatus } from "../entities";
import { BaseService, PaginatedResult } from "./base.service";
import { ProductQuery } from "../types/query.types";
import { generateSlug, generateSPK } from "../utils/slug";
import { NotFoundError, BusinessErrors } from "../utils/errors";

export class ProductService extends BaseService<Product> {
  protected entityName = "Product";

  constructor() {
    super(AppDataSource.getRepository(Product));
  }

  async findPaginatedProducts(
    query: ProductQuery
  ): Promise<PaginatedResult<Product>> {
    const qb = this.repository
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.brand", "brand")
      .leftJoinAndSelect("product.category", "category")
      .leftJoinAndSelect("product.variants", "variants")
      .leftJoinAndSelect("product.media", "media")
      .leftJoinAndSelect("product.tags", "tags");

    if (query.search) {
      qb.andWhere(
        "(product.name ILIKE :search OR product.spk ILIKE :search)",
        { search: `%${query.search}%` }
      );
    }

    if (query.categoryId) {
      qb.andWhere("product.categoryId = :categoryId", {
        categoryId: query.categoryId,
      });
    }

    if (query.brandId) {
      qb.andWhere("product.brandId = :brandId", { brandId: query.brandId });
    }

    if (query.status) {
      qb.andWhere("product.status = :status", { status: query.status });
    }

    if (query.isFeatured !== undefined) {
      qb.andWhere("product.isFeatured = :isFeatured", {
        isFeatured: query.isFeatured,
      });
    }

    if (query.minPrice !== undefined) {
      qb.andWhere("product.basePrice >= :minPrice", { minPrice: query.minPrice });
    }

    if (query.maxPrice !== undefined) {
      qb.andWhere("product.basePrice <= :maxPrice", { maxPrice: query.maxPrice });
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    qb.skip(skip).take(limit);

    if (query.sortBy) {
      qb.orderBy(
        `product.${query.sortBy}`,
        query.sortOrder || "DESC"
      );
    } else {
      qb.orderBy("product.createdAt", "DESC");
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    if (!data.slug && data.name) {
      data.slug = generateSlug(data.name);
    }

    // Check for duplicate slug
    const existingSlug = await this.findOne({ slug: data.slug });
    if (existingSlug) {
      throw BusinessErrors.DUPLICATE_SLUG(data.slug!);
    }

    if (!data.spk) {
      const count = await this.count();
      data.spk = generateSPK("PRD", count + 1);
    }

    return this.create(data);
  }

  async updateProduct(
    id: string,
    data: Partial<Product>
  ): Promise<Product> {
    const product = await this.findById(id);
    if (!product) {
      throw new NotFoundError(this.entityName, id);
    }

    if (data.name && !data.slug) {
      data.slug = generateSlug(data.name);
    }

    // Check for duplicate slug if changing
    if (data.slug && data.slug !== product.slug) {
      const existing = await this.findOne({ slug: data.slug });
      if (existing) {
        throw BusinessErrors.DUPLICATE_SLUG(data.slug);
      }
    }

    const updated = await this.update(id, data);
    return updated!;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const product = await this.findById(id);
    if (!product) {
      throw new NotFoundError(this.entityName, id);
    }

    return this.delete(id);
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.repository.findOne({
      where: { slug },
      relations: [
        "brand",
        "category",
        "variants",
        "variants.options",
        "variants.options.optionType",
        "variants.options.optionValue",
        "media",
        "attributes",
        "attributes.attribute",
        "tags",
      ],
    });
  }

  async findBySPK(spk: string): Promise<Product | null> {
    return this.repository.findOne({
      where: { spk },
      relations: ["brand", "category", "variants", "media", "tags"],
    });
  }

  async getProductWithFullDetails(id: string): Promise<Product> {
    const product = await this.repository.findOne({
      where: { id },
      relations: [
        "brand",
        "category",
        "variants",
        "variants.options",
        "variants.options.optionType",
        "variants.options.optionValue",
        "variants.inventories",
        "variants.inventories.warehouse",
        "media",
        "attributes",
        "attributes.attribute",
        "tags",
        "reviews",
        "reviews.replies",
        "questions",
        "questions.answers",
      ],
    });

    if (!product) {
      throw new NotFoundError(this.entityName, id);
    }

    return product;
  }

  async publishProduct(id: string): Promise<Product> {
    const product = await this.findById(id);
    if (!product) {
      throw new NotFoundError(this.entityName, id);
    }

    const updated = await this.update(id, {
      status: ProductStatus.ACTIVE,
      publishedAt: new Date(),
    });
    return updated!;
  }

  async unpublishProduct(id: string): Promise<Product> {
    const product = await this.findById(id);
    if (!product) {
      throw new NotFoundError(this.entityName, id);
    }

    const updated = await this.update(id, {
      status: ProductStatus.INACTIVE,
    });
    return updated!;
  }

  async getFeaturedProducts(limit = 10): Promise<Product[]> {
    return this.repository.find({
      where: { isFeatured: true, status: ProductStatus.ACTIVE },
      relations: ["brand", "category", "variants", "media"],
      take: limit,
      order: { createdAt: "DESC" },
    });
  }

  async updateProductTags(id: string, tagIds: string[]): Promise<Product> {
    const product = await this.repository.findOne({
      where: { id },
      relations: ["tags"],
    });

    if (!product) {
      throw new NotFoundError(this.entityName, id);
    }

    const tagRepository = AppDataSource.getRepository("Tag");
    const tags = await tagRepository.find({
      where: { id: In(tagIds) },
    });

    product.tags = tags as any;
    const saved = await this.repository.save(product);
    await this.invalidateEntityCache(id);
    return saved;
  }
}

export const productService = new ProductService();
