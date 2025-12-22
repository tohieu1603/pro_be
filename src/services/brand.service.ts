import { Like } from "typeorm";
import { AppDataSource } from "../data-source";
import { Brand } from "../entities";
import { BaseService, PaginatedResult } from "./base.service";
import { PaginationQuery } from "../types/query.types";
import { generateSlug } from "../utils/slug";
import { NotFoundError, BusinessErrors } from "../utils/errors";

export class BrandService extends BaseService<Brand> {
  protected entityName = "Brand";

  constructor() {
    super(AppDataSource.getRepository(Brand));
  }

  async findPaginatedBrands(
    query: PaginationQuery
  ): Promise<PaginatedResult<Brand>> {
    const where: any = {};

    if (query.search) {
      where.name = Like(`%${query.search}%`);
    }

    return this.findPaginated(query, where, undefined, {
      tags: [`${this.entityName}:list`],
    });
  }

  async createBrand(data: Partial<Brand>): Promise<Brand> {
    if (!data.slug && data.name) {
      data.slug = generateSlug(data.name);
    }

    // Check for duplicate slug
    const existing = await this.findOne({ slug: data.slug });
    if (existing) {
      throw BusinessErrors.DUPLICATE_SLUG(data.slug!);
    }

    return this.create(data);
  }

  async updateBrand(id: string, data: Partial<Brand>): Promise<Brand> {
    const brand = await this.findById(id);
    if (!brand) {
      throw new NotFoundError(this.entityName, id);
    }

    if (data.name && !data.slug) {
      data.slug = generateSlug(data.name);
    }

    // Check for duplicate slug if changing
    if (data.slug && data.slug !== brand.slug) {
      const existing = await this.findOne({ slug: data.slug });
      if (existing) {
        throw BusinessErrors.DUPLICATE_SLUG(data.slug);
      }
    }

    const updated = await this.update(id, data);
    return updated!;
  }

  async deleteBrand(id: string): Promise<boolean> {
    const brand = await this.findById(id);
    if (!brand) {
      throw new NotFoundError(this.entityName, id);
    }

    return this.delete(id);
  }

  async findBySlug(slug: string): Promise<Brand | null> {
    return this.findOne({ slug });
  }

  async getActiveBrands(): Promise<Brand[]> {
    return this.findAll(
      {
        where: { isActive: true },
        order: { name: "ASC" },
      },
      { tags: [`${this.entityName}:active`] }
    );
  }
}

export const brandService = new BrandService();
