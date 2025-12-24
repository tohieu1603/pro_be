import { Like, IsNull } from "typeorm";
import { AppDataSource } from "../data-source";
import { ArticleCategory } from "../entities";
import { BaseService, PaginatedResult } from "./base.service";
import { PaginationQuery } from "../types/query.types";
import { generateSlug } from "../utils/slug";
import { NotFoundError, BusinessError } from "../utils/errors";

export class ArticleCategoryService extends BaseService<ArticleCategory> {
  protected entityName = "ArticleCategory";

  constructor() {
    super(AppDataSource.getRepository(ArticleCategory));
  }

  async findPaginatedCategories(
    query: PaginationQuery
  ): Promise<PaginatedResult<ArticleCategory>> {
    const where: any = {};

    if (query.search) {
      where.name = Like(`%${query.search}%`);
    }

    return this.findPaginated(query, where, ["parent", "children"], {
      tags: [`${this.entityName}:list`],
    });
  }

  async createCategory(data: Partial<ArticleCategory>): Promise<ArticleCategory> {
    if (!data.slug && data.name) {
      data.slug = generateSlug(data.name);
    }

    // Check for duplicate slug
    const existing = await this.findOne({ slug: data.slug });
    if (existing) {
      throw new BusinessError(`Article category with slug "${data.slug}" already exists`, "DUPLICATE_SLUG");
    }

    return this.create(data);
  }

  async updateCategory(
    id: string,
    data: Partial<ArticleCategory>
  ): Promise<ArticleCategory> {
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
        throw new BusinessError(`Article category with slug "${data.slug}" already exists`, "DUPLICATE_SLUG");
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

    // Check if category has articles
    const articleCount = await AppDataSource.getRepository("Article").count({
      where: { categoryId: id },
    });

    if (articleCount > 0) {
      throw new BusinessError(`Cannot delete category with ${articleCount} articles`, "CATEGORY_HAS_ARTICLES");
    }

    return this.delete(id);
  }

  async findBySlug(slug: string): Promise<ArticleCategory | null> {
    return this.findOne({ slug }, ["parent", "children"]);
  }

  async getRootCategories(): Promise<ArticleCategory[]> {
    return this.findAll(
      {
        where: { parentId: IsNull(), isActive: true },
        relations: ["children"],
        order: { displayOrder: "ASC" },
      },
      { tags: [`${this.entityName}:root`] }
    );
  }

  async getCategoryTree(): Promise<ArticleCategory[]> {
    const categories = await this.findAll(
      {
        where: { isActive: true },
        relations: ["children"],
        order: { displayOrder: "ASC" },
      },
      { tags: [`${this.entityName}:tree`] }
    );

    // Build tree structure
    const categoryMap = new Map<string, ArticleCategory>();
    const rootCategories: ArticleCategory[] = [];

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

  async getActiveCategories(): Promise<ArticleCategory[]> {
    return this.findAll(
      {
        where: { isActive: true },
        order: { displayOrder: "ASC" },
      },
      { tags: [`${this.entityName}:active`] }
    );
  }
}

export const articleCategoryService = new ArticleCategoryService();
