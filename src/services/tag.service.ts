import { Like } from "typeorm";
import { AppDataSource } from "../data-source";
import { Tag, TagType } from "../entities";
import { BaseService, PaginatedResult } from "./base.service";
import { PaginationQuery } from "../types/query.types";
import { generateSlug } from "../utils/slug";
import { NotFoundError, BusinessErrors } from "../utils/errors";

export class TagService extends BaseService<Tag> {
  protected entityName = "Tag";

  constructor() {
    super(AppDataSource.getRepository(Tag));
  }

  async findPaginatedTags(
    query: PaginationQuery & { type?: TagType }
  ): Promise<PaginatedResult<Tag>> {
    const where: any = {};

    if (query.search) {
      where.name = Like(`%${query.search}%`);
    }

    if (query.type) {
      where.type = query.type;
    }

    return this.findPaginated(query, where, undefined, {
      tags: [`${this.entityName}:list`],
    });
  }

  async createTag(data: Partial<Tag>): Promise<Tag> {
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

  async updateTag(id: string, data: Partial<Tag>): Promise<Tag> {
    const tag = await this.findById(id);
    if (!tag) {
      throw new NotFoundError(this.entityName, id);
    }

    if (data.name && !data.slug) {
      data.slug = generateSlug(data.name);
    }

    // Check for duplicate slug if changing
    if (data.slug && data.slug !== tag.slug) {
      const existing = await this.findOne({ slug: data.slug });
      if (existing) {
        throw BusinessErrors.DUPLICATE_SLUG(data.slug);
      }
    }

    const updated = await this.update(id, data);
    return updated!;
  }

  async deleteTag(id: string): Promise<boolean> {
    const tag = await this.findById(id);
    if (!tag) {
      throw new NotFoundError(this.entityName, id);
    }

    return this.delete(id);
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    return this.findOne({ slug });
  }

  async getTagsByType(type: TagType): Promise<Tag[]> {
    return this.findAll(
      {
        where: { type },
        order: { name: "ASC" },
      },
      { tags: [`${this.entityName}:type:${type}`] }
    );
  }
}

export const tagService = new TagService();
