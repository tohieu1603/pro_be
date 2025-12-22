/**
 * Enhanced Base Service with Cache, Transaction, and advanced query support
 */

import {
  Repository,
  FindOptionsWhere,
  FindManyOptions,
  DeepPartial,
  ObjectLiteral,
  EntityManager,
  SelectQueryBuilder,
} from "typeorm";
import { PaginationQuery } from "../types/query.types";
import { cacheService, CacheService } from "../cache/cache.service";
import {
  TransactionContext,
  transactionManager,
  withTransaction,
} from "../utils/transaction-manager";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CacheOptions {
  ttl?: number;
  key?: string;
  tags?: string[];
  bypass?: boolean;
}

export interface QueryOptions<T> {
  where?: FindOptionsWhere<T>;
  relations?: string[];
  select?: (keyof T)[];
  order?: { [K in keyof T]?: "ASC" | "DESC" };
  cache?: CacheOptions;
}

/**
 * Enhanced Base Service with caching and transaction support
 */
export abstract class BaseService<T extends ObjectLiteral> {
  protected cache: CacheService;
  protected abstract entityName: string; // For cache key generation
  protected defaultCacheTTL = 300; // 5 minutes

  constructor(protected repository: Repository<T>) {
    this.cache = cacheService;
  }

  /**
   * Get repository - useful for transactions
   */
  getRepository(manager?: EntityManager): Repository<T> {
    if (manager) {
      return manager.getRepository(this.repository.target);
    }
    return this.repository;
  }

  // ==================== READ OPERATIONS ====================

  /**
   * Find all with optional caching
   */
  async findAll(
    options?: FindManyOptions<T>,
    cacheOpts?: CacheOptions
  ): Promise<T[]> {
    if (cacheOpts?.bypass) {
      return this.repository.find(options);
    }

    const cacheKey =
      cacheOpts?.key || this.generateCacheKey("findAll", options);

    return this.cache.getOrSet(
      cacheKey,
      () => this.repository.find(options),
      { ttl: cacheOpts?.ttl || this.defaultCacheTTL, tags: cacheOpts?.tags }
    );
  }

  /**
   * Find with pagination and optional caching
   */
  async findPaginated(
    query: PaginationQuery,
    where?: FindOptionsWhere<T>,
    relations?: string[],
    cacheOpts?: CacheOptions
  ): Promise<PaginatedResult<T>> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const fetchFn = async () => {
      const [data, total] = await this.repository.findAndCount({
        where,
        relations,
        skip,
        take: limit,
        order: query.sortBy
          ? ({ [query.sortBy]: query.sortOrder || "DESC" } as any)
          : undefined,
      });

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    };

    if (cacheOpts?.bypass) {
      return fetchFn();
    }

    const cacheKey =
      cacheOpts?.key ||
      this.generateCacheKey("paginated", { query, where });

    return this.cache.getOrSet(cacheKey, fetchFn, {
      ttl: cacheOpts?.ttl || this.defaultCacheTTL,
      tags: cacheOpts?.tags,
    });
  }

  /**
   * Find by ID with caching
   */
  async findById(
    id: string,
    relations?: string[],
    cacheOpts?: CacheOptions
  ): Promise<T | null> {
    if (cacheOpts?.bypass) {
      return this.repository.findOne({
        where: { id } as unknown as FindOptionsWhere<T>,
        relations,
      });
    }

    const cacheKey = cacheOpts?.key || `${this.entityName}:${id}`;

    return this.cache.getOrSet(
      cacheKey,
      () =>
        this.repository.findOne({
          where: { id } as unknown as FindOptionsWhere<T>,
          relations,
        }),
      { ttl: cacheOpts?.ttl || this.defaultCacheTTL, tags: cacheOpts?.tags }
    );
  }

  /**
   * Find one by conditions
   */
  async findOne(
    where: FindOptionsWhere<T>,
    relations?: string[]
  ): Promise<T | null> {
    return this.repository.findOne({ where, relations });
  }

  /**
   * Find or throw error
   */
  async findByIdOrFail(id: string, relations?: string[]): Promise<T> {
    const entity = await this.findById(id, relations);
    if (!entity) {
      throw new Error(`${this.entityName} with ID ${id} not found`);
    }
    return entity;
  }

  /**
   * Check if entity exists
   */
  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repository.count({ where });
    return count > 0;
  }

  /**
   * Count entities
   */
  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count({ where });
  }

  // ==================== WRITE OPERATIONS ====================

  /**
   * Create entity with cache invalidation
   */
  async create(
    data: DeepPartial<T>,
    manager?: EntityManager
  ): Promise<T> {
    const repo = this.getRepository(manager);
    const entity = repo.create(data);
    const saved = await repo.save(entity);

    // Invalidate list caches
    await this.invalidateListCache();

    return saved;
  }

  /**
   * Create multiple entities
   */
  async createMany(
    items: DeepPartial<T>[],
    manager?: EntityManager
  ): Promise<T[]> {
    const repo = this.getRepository(manager);
    const entities = repo.create(items);
    const saved = await repo.save(entities);

    await this.invalidateListCache();

    return saved;
  }

  /**
   * Update entity with cache invalidation
   */
  async update(
    id: string,
    data: DeepPartial<T>,
    manager?: EntityManager
  ): Promise<T | null> {
    const repo = this.getRepository(manager);
    await repo.update(id, data as any);

    // Invalidate caches
    await this.invalidateEntityCache(id);

    return this.findById(id, undefined, { bypass: true });
  }

  /**
   * Update and return in transaction
   */
  async updateAndReturn(
    id: string,
    data: DeepPartial<T>
  ): Promise<T | null> {
    return withTransaction(async ({ manager }) => {
      const repo = this.getRepository(manager);
      await repo.update(id, data as any);
      const updated = await repo.findOne({
        where: { id } as unknown as FindOptionsWhere<T>,
      });

      if (updated) {
        await this.invalidateEntityCache(id);
      }

      return updated;
    });
  }

  /**
   * Upsert (insert or update)
   */
  async upsert(
    data: DeepPartial<T>,
    conflictPaths: string[]
  ): Promise<T> {
    await this.repository.upsert(data as any, conflictPaths);

    // Get the upserted entity
    const where: any = {};
    for (const path of conflictPaths) {
      where[path] = (data as any)[path];
    }

    const entity = await this.findOne(where);
    if (entity) {
      await this.invalidateListCache();
    }

    return entity!;
  }

  /**
   * Soft delete (if entity has deletedAt column)
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    if ((result.affected ?? 0) > 0) {
      await this.invalidateEntityCache(id);
      return true;
    }
    return false;
  }

  /**
   * Hard delete with cache invalidation
   */
  async delete(id: string, manager?: EntityManager): Promise<boolean> {
    const repo = this.getRepository(manager);
    const result = await repo.delete(id);

    if ((result.affected ?? 0) > 0) {
      await this.invalidateEntityCache(id);
      return true;
    }

    return false;
  }

  /**
   * Delete multiple entities
   */
  async deleteMany(ids: string[]): Promise<number> {
    const result = await this.repository.delete(ids);
    const affected = result.affected ?? 0;

    if (affected > 0) {
      await Promise.all(ids.map((id) => this.invalidateEntityCache(id)));
    }

    return affected;
  }

  // ==================== TRANSACTION SUPPORT ====================

  /**
   * Run operation in transaction
   */
  async withTransaction<R>(
    callback: (context: TransactionContext, repo: Repository<T>) => Promise<R>
  ): Promise<R> {
    return transactionManager.runInTransaction(async (context) => {
      const repo = this.getRepository(context.manager);
      return callback(context, repo);
    });
  }

  /**
   * Create in transaction
   */
  async createInTransaction(
    data: DeepPartial<T>,
    additionalOps?: (context: TransactionContext, entity: T) => Promise<void>
  ): Promise<T> {
    return this.withTransaction(async (context, repo) => {
      const entity = repo.create(data);
      const saved = await repo.save(entity);

      if (additionalOps) {
        await additionalOps(context, saved);
      }

      await this.invalidateListCache();
      return saved;
    });
  }

  // ==================== QUERY BUILDER ====================

  /**
   * Create query builder with alias
   */
  createQueryBuilder(alias?: string): SelectQueryBuilder<T> {
    return this.repository.createQueryBuilder(alias || this.entityName.toLowerCase());
  }

  /**
   * Execute raw query
   */
  async rawQuery<R = any>(query: string, params?: any[]): Promise<R> {
    return this.repository.query(query, params);
  }

  // ==================== CACHE MANAGEMENT ====================

  /**
   * Generate cache key based on method and params
   */
  protected generateCacheKey(method: string, params?: any): string {
    const paramsStr = params ? JSON.stringify(params) : "";
    return `${this.entityName}:${method}:${paramsStr}`;
  }

  /**
   * Invalidate entity-specific cache
   */
  protected async invalidateEntityCache(id: string): Promise<void> {
    await this.cache.delete(`${this.entityName}:${id}`);
    await this.invalidateListCache();
  }

  /**
   * Invalidate list caches
   */
  protected async invalidateListCache(): Promise<void> {
    await this.cache.deleteByPattern(`${this.entityName}:*`);
  }

  /**
   * Clear all cache for this entity
   */
  async clearCache(): Promise<void> {
    await this.cache.deleteByPattern(`${this.entityName}:*`);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Increment a numeric field
   */
  async increment(
    id: string,
    field: keyof T,
    value: number = 1
  ): Promise<void> {
    await this.repository.increment({ id } as any, field as string, value);
    await this.invalidateEntityCache(id);
  }

  /**
   * Decrement a numeric field
   */
  async decrement(
    id: string,
    field: keyof T,
    value: number = 1
  ): Promise<void> {
    await this.repository.decrement({ id } as any, field as string, value);
    await this.invalidateEntityCache(id);
  }

  /**
   * Bulk update by IDs
   */
  async bulkUpdate(
    ids: string[],
    data: DeepPartial<T>
  ): Promise<number> {
    if (ids.length === 0) return 0;

    const result = await this.repository
      .createQueryBuilder()
      .update()
      .set(data as any)
      .whereInIds(ids)
      .execute();

    await this.invalidateListCache();

    return result.affected ?? 0;
  }

  /**
   * Get distinct values for a field
   */
  async getDistinct<K extends keyof T>(field: K): Promise<T[K][]> {
    const result = await this.repository
      .createQueryBuilder()
      .select(`DISTINCT "${String(field)}"`, "value")
      .getRawMany();

    return result.map((r) => r.value);
  }
}
