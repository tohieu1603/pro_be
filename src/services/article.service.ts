import { Like, In, LessThanOrEqual, MoreThan } from "typeorm";
import { AppDataSource } from "../data-source";
import { Article, ArticleStatus, Tag } from "../entities";
import { BaseService, PaginatedResult } from "./base.service";
import { PaginationQuery } from "../types/query.types";
import { generateSlug } from "../utils/slug";
import { NotFoundError, BusinessError } from "../utils/errors";

export interface ArticleQuery extends PaginationQuery {
  status?: ArticleStatus;
  categoryId?: string;
  authorId?: string;
  isFeatured?: boolean;
  tagIds?: string[];
}

export interface CreateArticleDTO {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  categoryId?: string;
  authorId?: string;
  status?: ArticleStatus;
  scheduledAt?: Date;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  schemaMarkup?: Record<string, any>;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  isFeatured?: boolean;
  isSticky?: boolean;
  displayOrder?: number;
  tagIds?: string[];
}

export class ArticleService extends BaseService<Article> {
  protected entityName = "Article";

  constructor() {
    super(AppDataSource.getRepository(Article));
  }

  /**
   * Calculate reading time based on content
   * Average reading speed: 200-250 words per minute
   */
  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Find paginated articles with filters
   */
  async findPaginatedArticles(
    query: ArticleQuery
  ): Promise<PaginatedResult<Article>> {
    const qb = this.createQueryBuilder("article")
      .leftJoinAndSelect("article.category", "category")
      .leftJoinAndSelect("article.author", "author")
      .leftJoinAndSelect("article.tags", "tags");

    // Search
    if (query.search) {
      qb.andWhere(
        "(article.title ILIKE :search OR article.excerpt ILIKE :search)",
        { search: `%${query.search}%` }
      );
    }

    // Filters
    if (query.status) {
      qb.andWhere("article.status = :status", { status: query.status });
    }

    if (query.categoryId) {
      qb.andWhere("article.categoryId = :categoryId", {
        categoryId: query.categoryId,
      });
    }

    if (query.authorId) {
      qb.andWhere("article.authorId = :authorId", { authorId: query.authorId });
    }

    if (query.isFeatured !== undefined) {
      qb.andWhere("article.isFeatured = :isFeatured", {
        isFeatured: query.isFeatured,
      });
    }

    if (query.tagIds && query.tagIds.length > 0) {
      qb.andWhere("tags.id IN (:...tagIds)", { tagIds: query.tagIds });
    }

    // Sorting
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "DESC";
    qb.orderBy(`article.${sortBy}`, sortOrder as "ASC" | "DESC");

    // Pagination
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create article
   */
  async createArticle(data: CreateArticleDTO): Promise<Article> {
    // Generate slug if not provided
    if (!data.slug) {
      data.slug = generateSlug(data.title);
    }

    // Check for duplicate slug
    const existing = await this.findOne({ slug: data.slug });
    if (existing) {
      throw new BusinessError(
        `Article with slug "${data.slug}" already exists`,
        "DUPLICATE_SLUG"
      );
    }

    // Calculate reading time
    const readingTime = this.calculateReadingTime(data.content);

    // Handle publishing
    let publishedAt: Date | undefined;
    if (data.status === ArticleStatus.PUBLISHED) {
      publishedAt = new Date();
    }

    // Create article
    const { tagIds, ...articleData } = data;
    const article = this.repository.create({
      ...articleData,
      readingTime,
      publishedAt,
    });

    const saved = await this.repository.save(article);

    // Handle tags
    if (tagIds && tagIds.length > 0) {
      const tags = await AppDataSource.getRepository(Tag).findBy({
        id: In(tagIds),
      });
      saved.tags = tags;
      await this.repository.save(saved);
    }

    await this.invalidateListCache();

    const result = await this.findById(saved.id, ["category", "author", "tags"]);
    return result!;
  }

  /**
   * Update article
   */
  async updateArticle(id: string, data: Partial<CreateArticleDTO>): Promise<Article> {
    const article = await this.findById(id);
    if (!article) {
      throw new NotFoundError(this.entityName, id);
    }

    // Generate slug if title changed but slug not provided
    if (data.title && !data.slug) {
      data.slug = generateSlug(data.title);
    }

    // Check for duplicate slug if changing
    if (data.slug && data.slug !== article.slug) {
      const existing = await this.findOne({ slug: data.slug });
      if (existing) {
        throw new BusinessError(
          `Article with slug "${data.slug}" already exists`,
          "DUPLICATE_SLUG"
        );
      }
    }

    // Recalculate reading time if content changed
    if (data.content) {
      (data as any).readingTime = this.calculateReadingTime(data.content);
    }

    // Handle status change
    if (data.status === ArticleStatus.PUBLISHED && article.status !== ArticleStatus.PUBLISHED) {
      (data as any).publishedAt = new Date();
    }

    // Update article
    const { tagIds, ...articleData } = data;
    await this.update(id, articleData);

    // Handle tags
    if (tagIds !== undefined) {
      const articleWithTags = await this.repository.findOne({
        where: { id },
        relations: ["tags"],
      });

      if (articleWithTags) {
        if (tagIds.length > 0) {
          const tags = await AppDataSource.getRepository(Tag).findBy({
            id: In(tagIds),
          });
          articleWithTags.tags = tags;
        } else {
          articleWithTags.tags = [];
        }
        await this.repository.save(articleWithTags);
      }
    }

    return (await this.findById(id, ["category", "author", "tags"]))!;
  }

  /**
   * Delete article
   */
  async deleteArticle(id: string): Promise<boolean> {
    const article = await this.findById(id);
    if (!article) {
      throw new NotFoundError(this.entityName, id);
    }

    return this.delete(id);
  }

  /**
   * Find by slug
   */
  async findBySlug(slug: string): Promise<Article | null> {
    return this.findOne({ slug }, ["category", "author", "tags"]);
  }

  /**
   * Publish article
   */
  async publish(id: string): Promise<Article> {
    const article = await this.findById(id);
    if (!article) {
      throw new NotFoundError(this.entityName, id);
    }

    await this.update(id, {
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
    } as any);

    return (await this.findById(id, ["category", "author", "tags"]))!;
  }

  /**
   * Unpublish article (set to draft)
   */
  async unpublish(id: string): Promise<Article> {
    const article = await this.findById(id);
    if (!article) {
      throw new NotFoundError(this.entityName, id);
    }

    await this.update(id, {
      status: ArticleStatus.DRAFT,
    } as any);

    return (await this.findById(id, ["category", "author", "tags"]))!;
  }

  /**
   * Archive article
   */
  async archive(id: string): Promise<Article> {
    const article = await this.findById(id);
    if (!article) {
      throw new NotFoundError(this.entityName, id);
    }

    await this.update(id, {
      status: ArticleStatus.ARCHIVED,
    } as any);

    return (await this.findById(id, ["category", "author", "tags"]))!;
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.increment(id, "viewCount" as any);
  }

  /**
   * Get featured articles
   */
  async getFeaturedArticles(limit: number = 5): Promise<Article[]> {
    return this.findAll(
      {
        where: {
          status: ArticleStatus.PUBLISHED,
          isFeatured: true,
        },
        relations: ["category", "author"],
        order: { publishedAt: "DESC" },
        take: limit,
      },
      { tags: [`${this.entityName}:featured`] }
    );
  }

  /**
   * Get recent articles
   */
  async getRecentArticles(limit: number = 10): Promise<Article[]> {
    return this.findAll(
      {
        where: { status: ArticleStatus.PUBLISHED },
        relations: ["category", "author"],
        order: { publishedAt: "DESC" },
        take: limit,
      },
      { tags: [`${this.entityName}:recent`] }
    );
  }

  /**
   * Get articles by category
   */
  async getArticlesByCategory(
    categoryId: string,
    limit: number = 10
  ): Promise<Article[]> {
    return this.findAll(
      {
        where: {
          categoryId,
          status: ArticleStatus.PUBLISHED,
        },
        relations: ["category", "author"],
        order: { publishedAt: "DESC" },
        take: limit,
      },
      { tags: [`${this.entityName}:category:${categoryId}`] }
    );
  }

  /**
   * Get published articles for sitemap
   */
  async getPublishedForSitemap(): Promise<Article[]> {
    return this.findAll({
      where: {
        status: ArticleStatus.PUBLISHED,
        robotsIndex: true,
      },
      select: ["id", "slug", "updatedAt", "publishedAt"],
      order: { publishedAt: "DESC" },
    });
  }

  /**
   * Publish scheduled articles
   */
  async publishScheduledArticles(): Promise<number> {
    const now = new Date();
    const scheduled = await this.findAll({
      where: {
        status: ArticleStatus.SCHEDULED,
        scheduledAt: LessThanOrEqual(now),
      },
    });

    for (const article of scheduled) {
      await this.update(article.id, {
        status: ArticleStatus.PUBLISHED,
        publishedAt: now,
      } as any);
    }

    if (scheduled.length > 0) {
      await this.invalidateListCache();
    }

    return scheduled.length;
  }
}

export const articleService = new ArticleService();
