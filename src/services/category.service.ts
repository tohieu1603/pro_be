import { Like, IsNull } from "typeorm";
import { AppDataSource } from "../data-source";
import { Category } from "../entities";
import { BaseService, PaginatedResult } from "./base.service";
import { PaginationQuery } from "../types/query.types";
import { generateSlug } from "../utils/slug";
import { NotFoundError, BusinessErrors } from "../utils/errors";

export class CategoryService extends BaseService<Category> {
  protected entityName = "Category";

  constructor() {
    super(AppDataSource.getRepository(Category));
  }

  async findPaginatedCategories(
    query: PaginationQuery
  ): Promise<PaginatedResult<Category>> {
    const where: any = {};

    if (query.search) {
      where.name = Like(`%${query.search}%`);
    }

    return this.findPaginated(query, where, ["parent", "children"], {
      tags: [`${this.entityName}:list`],
    });
  }

  async createCategory(data: Partial<Category>): Promise<Category> {
    if (!data.slug && data.name) {
      data.slug = generateSlug(data.name);
    }

    // Check for duplicate slug
    const existing = await this.findOne({ slug: data.slug });
    if (existing) {
      throw BusinessErrors.DUPLICATE_SLUG(data.slug!);
    }

    // Calculate level and path
    if (data.parentId) {
      const parent = await this.findById(data.parentId);
      if (!parent) {
        throw new NotFoundError("Parent Category", data.parentId);
      }
      data.level = parent.level + 1;
      data.path = parent.path
        ? `${parent.path}.${data.slug?.replace(/-/g, "_")}`
        : data.slug?.replace(/-/g, "_");
    } else {
      data.level = 0;
      data.path = data.slug?.replace(/-/g, "_");
    }

    return this.create(data);
  }

  async updateCategory(
    id: string,
    data: Partial<Category>
  ): Promise<Category> {
    const category = await this.findById(id);
    if (!category) {
      throw new NotFoundError(this.entityName, id);
    }

    if (data.name && !data.slug) {
      data.slug = generateSlug(data.name);
    }

    // Check for duplicate slug if changing
    if (data.slug && data.slug !== category.slug) {
      const existing = await this.findOne({ slug: data.slug });
      if (existing) {
        throw BusinessErrors.DUPLICATE_SLUG(data.slug);
      }
    }

    const updated = await this.update(id, data);
    return updated!;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const category = await this.findById(id);
    if (!category) {
      throw new NotFoundError(this.entityName, id);
    }

    // Check if category has products
    const productCount = await AppDataSource.getRepository("Product").count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw BusinessErrors.CATEGORY_HAS_PRODUCTS(id);
    }

    return this.delete(id);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.findOne({ slug }, ["parent", "children"]);
  }

  async getRootCategories(): Promise<Category[]> {
    return this.findAll(
      {
        where: { parentId: IsNull(), isActive: true },
        relations: ["children"],
        order: { displayOrder: "ASC" },
      },
      { tags: [`${this.entityName}:root`] }
    );
  }

  async getCategoryTree(): Promise<Category[]> {
    const categories = await this.findAll(
      {
        where: { isActive: true },
        relations: ["children"],
        order: { displayOrder: "ASC", level: "ASC" },
      },
      { tags: [`${this.entityName}:tree`] }
    );

    // Build tree structure
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    categories.forEach((cat) => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  }

  async getActiveCategories(): Promise<Category[]> {
    return this.findAll(
      {
        where: { isActive: true },
        order: { displayOrder: "ASC" },
      },
      { tags: [`${this.entityName}:active`] }
    );
  }
}

export const categoryService = new CategoryService();
