/**
 * Generic In-Memory Cache Service
 * Supports TTL, tags for invalidation, and various cache strategies
 * Can be extended to use Redis by implementing ICacheProvider
 */

export interface ICacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  deleteByPattern(pattern: string): Promise<number>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
  tags: string[];
}

export class MemoryCacheProvider implements ICacheProvider {
  private cache = new Map<string, CacheEntry<unknown>>();
  private tagIndex = new Map<string, Set<string>>(); // tag -> keys

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      await this.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
    tags: string[] = []
  ): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;

    this.cache.set(key, { value, expiresAt, tags });

    // Update tag index
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Remove from tag index
    for (const tag of entry.tags) {
      this.tagIndex.get(tag)?.delete(key);
    }

    return this.cache.delete(key);
  }

  async deleteByPattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        await this.delete(key);
        count++;
      }
    }

    return count;
  }

  async deleteByTag(tag: string): Promise<number> {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;

    let count = 0;
    for (const key of keys) {
      if (await this.delete(key)) count++;
    }

    this.tagIndex.delete(tag);
    return count;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.tagIndex.clear();
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  // Get cache stats
  getStats(): { size: number; tags: number } {
    return {
      size: this.cache.size,
      tags: this.tagIndex.size,
    };
  }
}

/**
 * Cache Service with advanced features
 */
export class CacheService {
  private static instance: CacheService;
  private provider: MemoryCacheProvider;
  private defaultTTL = 300; // 5 minutes

  private constructor() {
    this.provider = new MemoryCacheProvider();
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get or Set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: { ttl?: number; tags?: string[] }
  ): Promise<T> {
    const cached = await this.provider.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.provider.set(
      key,
      value,
      options?.ttl || this.defaultTTL,
      options?.tags || []
    );
    return value;
  }

  /**
   * Cache decorator helper - generates cache key from function args
   */
  generateKey(prefix: string, ...args: unknown[]): string {
    const argsHash = args
      .map((arg) => {
        if (typeof arg === "object") {
          return JSON.stringify(arg);
        }
        return String(arg);
      })
      .join(":");

    return `${prefix}:${argsHash}`;
  }

  // Proxy methods
  async get<T>(key: string): Promise<T | null> {
    return this.provider.get<T>(key);
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
    tags?: string[]
  ): Promise<void> {
    return this.provider.set(key, value, ttlSeconds, tags);
  }

  async delete(key: string): Promise<boolean> {
    return this.provider.delete(key);
  }

  async deleteByPattern(pattern: string): Promise<number> {
    return this.provider.deleteByPattern(pattern);
  }

  async deleteByTag(tag: string): Promise<number> {
    return this.provider.deleteByTag(tag);
  }

  async clear(): Promise<void> {
    return this.provider.clear();
  }

  async invalidate(...keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.delete(key)));
  }

  getStats() {
    return this.provider.getStats();
  }

  setDefaultTTL(seconds: number): void {
    this.defaultTTL = seconds;
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();

/**
 * Cache key generators for common entities
 */
export const CacheKeys = {
  // Products
  product: (id: string) => `product:${id}`,
  productBySlug: (slug: string) => `product:slug:${slug}`,
  productBySPK: (spk: string) => `product:spk:${spk}`,
  productList: (params: string) => `products:list:${params}`,
  productFeatured: () => `products:featured`,

  // Categories
  category: (id: string) => `category:${id}`,
  categoryTree: () => `categories:tree`,
  categoryList: () => `categories:list`,

  // Brands
  brand: (id: string) => `brand:${id}`,
  brandList: () => `brands:list`,

  // Inventory
  inventory: (variantId: string, warehouseId: string) =>
    `inventory:${variantId}:${warehouseId}`,
  inventoryByVariant: (variantId: string) => `inventory:variant:${variantId}`,

  // Tags for invalidation
  Tags: {
    PRODUCTS: "tag:products",
    CATEGORIES: "tag:categories",
    BRANDS: "tag:brands",
    INVENTORY: "tag:inventory",
  },
};
