import { Like, In } from "typeorm";
import { AppDataSource } from "../data-source";
import { Region } from "../entities";
import { BaseService, PaginatedResult } from "./base.service";
import { PaginationQuery } from "../types/query.types";
import { normalizeRegionSlug, VIETNAM_PROVINCES } from "../utils/multi-tenant";
import { NotFoundError, BusinessError } from "../utils/errors";
import { clearRegionsCache } from "../middleware/region.middleware";

export interface CreateRegionDTO {
  name: string;
  slug?: string;
  subdomain?: string;
  phone?: string;
  phoneSecondary?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  zipcode?: string;
  latitude?: number;
  longitude?: number;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  workingHours?: Record<string, string>;
  shippingFee?: number;
  freeShippingThreshold?: number;
  displayOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export class RegionService extends BaseService<Region> {
  protected entityName = "Region";

  constructor() {
    super(AppDataSource.getRepository(Region));
  }

  /**
   * Find paginated regions
   */
  async findPaginatedRegions(
    query: PaginationQuery
  ): Promise<PaginatedResult<Region>> {
    const where: any = {};

    if (query.search) {
      where.name = Like(`%${query.search}%`);
    }

    return this.findPaginated(query, where, [], {
      tags: [`${this.entityName}:list`],
    });
  }

  /**
   * Create region
   */
  async createRegion(data: CreateRegionDTO): Promise<Region> {
    // Generate slug if not provided
    if (!data.slug) {
      data.slug = normalizeRegionSlug(data.name);
    }

    // Use slug as subdomain if not provided
    if (!data.subdomain) {
      data.subdomain = data.slug;
    }

    // Check for duplicate slug/subdomain
    const existingSlug = await this.findOne({ slug: data.slug });
    if (existingSlug) {
      throw new BusinessError(`Region with slug "${data.slug}" already exists`, "DUPLICATE_SLUG");
    }

    const existingSubdomain = await this.findOne({ subdomain: data.subdomain });
    if (existingSubdomain) {
      throw new BusinessError(`Region with subdomain "${data.subdomain}" already exists`, "DUPLICATE_SUBDOMAIN");
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await this.unsetDefaultRegion();
    }

    const region = await this.create(data);
    clearRegionsCache();
    return region;
  }

  /**
   * Update region
   */
  async updateRegion(id: string, data: Partial<CreateRegionDTO>): Promise<Region> {
    const region = await this.findById(id);
    if (!region) {
      throw new NotFoundError(this.entityName, id);
    }

    // Check duplicate slug if changing
    if (data.slug && data.slug !== region.slug) {
      const existing = await this.findOne({ slug: data.slug });
      if (existing) {
        throw new BusinessError(`Region with slug "${data.slug}" already exists`, "DUPLICATE_SLUG");
      }
    }

    // Check duplicate subdomain if changing
    if (data.subdomain && data.subdomain !== region.subdomain) {
      const existing = await this.findOne({ subdomain: data.subdomain });
      if (existing) {
        throw new BusinessError(`Region with subdomain "${data.subdomain}" already exists`, "DUPLICATE_SUBDOMAIN");
      }
    }

    // If setting as default, unset other defaults
    if (data.isDefault && !region.isDefault) {
      await this.unsetDefaultRegion();
    }

    const updated = await this.update(id, data);
    clearRegionsCache();
    return updated!;
  }

  /**
   * Delete region
   */
  async deleteRegion(id: string): Promise<boolean> {
    const region = await this.findById(id);
    if (!region) {
      throw new NotFoundError(this.entityName, id);
    }

    if (region.isDefault) {
      throw new BusinessError("Cannot delete default region", "CANNOT_DELETE_DEFAULT");
    }

    const result = await this.delete(id);
    clearRegionsCache();
    return result;
  }

  /**
   * Get region by slug
   */
  async findBySlug(slug: string): Promise<Region | null> {
    return this.findOne({ slug });
  }

  /**
   * Get region by subdomain
   */
  async findBySubdomain(subdomain: string): Promise<Region | null> {
    return this.findOne({ subdomain: subdomain.toLowerCase() });
  }

  /**
   * Get active regions
   */
  async getActiveRegions(): Promise<Region[]> {
    return this.findAll(
      {
        where: { isActive: true },
        order: { displayOrder: "ASC", name: "ASC" },
      },
      { tags: [`${this.entityName}:active`] }
    );
  }

  /**
   * Get default region
   */
  async getDefaultRegion(): Promise<Region | null> {
    return this.findOne({ isDefault: true, isActive: true });
  }

  /**
   * Unset all default regions
   */
  private async unsetDefaultRegion(): Promise<void> {
    await this.repository.update({ isDefault: true }, { isDefault: false });
    clearRegionsCache();
  }

  /**
   * Set region as default
   */
  async setAsDefault(id: string): Promise<Region> {
    const region = await this.findById(id);
    if (!region) {
      throw new NotFoundError(this.entityName, id);
    }

    await this.unsetDefaultRegion();
    const updated = await this.update(id, { isDefault: true });
    clearRegionsCache();
    return updated!;
  }

  /**
   * Seed default Vietnamese provinces as regions
   */
  async seedVietnameseProvinces(provinces: string[]): Promise<Region[]> {
    const created: Region[] = [];

    for (const slug of provinces) {
      const name = VIETNAM_PROVINCES[slug];
      if (!name) continue;

      // Check if already exists
      const existing = await this.findOne({ slug });
      if (existing) continue;

      try {
        const region = await this.createRegion({
          name,
          slug,
          subdomain: slug,
          province: name,
          isActive: true,
          displayOrder: created.length,
        });
        created.push(region);
      } catch (error) {
        console.error(`Error creating region ${slug}:`, error);
      }
    }

    return created;
  }
}

export const regionService = new RegionService();
