/**
 * Public API Routes for Customer-facing Website
 * Routes: /api/public/...
 * No authentication required
 * Supports region-specific content via slug parameter
 */

import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Product, ProductStatus, Region, ProductRegion, Category, Article, ArticleStatus } from "../entities";
import { sendSuccess, sendError, sendNotFound, PaginationMeta } from "../utils/api-response";
import { Like } from "typeorm";

const router = Router();

// ============================================
// REGION INFO
// ============================================

/**
 * GET /api/public/regions
 * Get all active regions (for region selector)
 */
router.get("/regions", async (_req: Request, res: Response) => {
  try {
    const regionRepo = AppDataSource.getRepository(Region);
    const regions = await regionRepo.find({
      where: { isActive: true },
      select: ["id", "name", "slug", "subdomain", "province"],
      order: { displayOrder: "ASC" },
    });
    sendSuccess(res, regions);
  } catch (error) {
    sendError(res, "Failed to fetch regions");
  }
});

/**
 * GET /api/public/regions/:slug
 * Get region info by slug (for header/footer contact info)
 */
router.get("/regions/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const regionRepo = AppDataSource.getRepository(Region);
    const region = await regionRepo.findOne({
      where: { slug, isActive: true },
    });

    if (!region) {
      return sendNotFound(res, "Region");
    }

    sendSuccess(res, region);
  } catch (error) {
    sendError(res, "Failed to fetch region");
  }
});

// ============================================
// PRODUCTS WITH REGION PRICING
// ============================================

/**
 * GET /api/public/:regionSlug/products
 * Get products with region-specific pricing
 */
router.get("/:regionSlug/products", async (req: Request, res: Response) => {
  try {
    const { regionSlug } = req.params;
    const { page = 1, limit = 12, category, brand, search, sort } = req.query;

    // Get region
    const regionRepo = AppDataSource.getRepository(Region);
    const region = await regionRepo.findOne({
      where: { slug: regionSlug, isActive: true },
    });

    if (!region) {
      return sendNotFound(res, "Region");
    }

    // Build product query
    const productRepo = AppDataSource.getRepository(Product);
    const qb = productRepo
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.brand", "brand")
      .leftJoinAndSelect("p.category", "category")
      .leftJoinAndSelect("p.media", "media")
      .leftJoin(
        ProductRegion,
        "pr",
        "pr.product_id = p.id AND pr.region_id = :regionId",
        { regionId: region.id }
      )
      .addSelect([
        "COALESCE(pr.price, p.base_price) as region_price",
        "pr.compare_at_price as region_compare_price",
        "COALESCE(pr.stock_quantity, 0) as region_stock",
        "COALESCE(pr.is_available, true) as region_available",
        "pr.promotion_text as promotion_text",
        "pr.shipping_note as shipping_note",
        "pr.delivery_days as delivery_days",
      ])
      .where("p.status = :status", { status: ProductStatus.ACTIVE });

    // Filter by category
    if (category) {
      qb.andWhere("category.slug = :categorySlug", { categorySlug: category });
    }

    // Filter by brand
    if (brand) {
      qb.andWhere("brand.slug = :brandSlug", { brandSlug: brand });
    }

    // Search
    if (search) {
      qb.andWhere("(p.name ILIKE :search OR p.spk ILIKE :search)", {
        search: `%${search}%`,
      });
    }

    // Only show products available in this region
    qb.andWhere("(pr.id IS NULL OR pr.is_available = true)");

    // Sort
    switch (sort) {
      case "price_asc":
        qb.orderBy("COALESCE(pr.price, p.base_price)", "ASC");
        break;
      case "price_desc":
        qb.orderBy("COALESCE(pr.price, p.base_price)", "DESC");
        break;
      case "newest":
        qb.orderBy("p.created_at", "DESC");
        break;
      case "popular":
        qb.orderBy("p.view_count", "DESC");
        break;
      default:
        qb.orderBy("p.created_at", "DESC");
    }

    // Pagination
    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), 50);
    const offset = (pageNum - 1) * limitNum;

    const [rawProducts, total] = await Promise.all([
      qb.offset(offset).limit(limitNum).getRawAndEntities(),
      qb.getCount(),
    ]);

    // Merge region pricing into products
    const products = rawProducts.entities.map((product, index) => {
      const raw = rawProducts.raw[index];
      return {
        ...product,
        regionPrice: raw.region_price ? Number(raw.region_price) : Number(product.basePrice),
        regionComparePrice: raw.region_compare_price ? Number(raw.region_compare_price) : null,
        regionStock: raw.region_stock ? Number(raw.region_stock) : null,
        promotionText: raw.promotion_text,
        shippingNote: raw.shipping_note,
        deliveryDays: raw.delivery_days,
      };
    });

    const meta: PaginationMeta = {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    };
    sendSuccess(res, products, undefined, meta);
  } catch (error) {
    console.error("Error fetching products:", error);
    sendError(res, "Failed to fetch products");
  }
});

/**
 * GET /api/public/:regionSlug/products/:productSlug
 * Get single product with region-specific pricing
 */
router.get("/:regionSlug/products/:productSlug", async (req: Request, res: Response) => {
  try {
    const { regionSlug, productSlug } = req.params;

    // Get region
    const regionRepo = AppDataSource.getRepository(Region);
    const region = await regionRepo.findOne({
      where: { slug: regionSlug, isActive: true },
    });

    if (!region) {
      return sendNotFound(res, "Region");
    }

    // Get product with all relations
    const productRepo = AppDataSource.getRepository(Product);
    const product = await productRepo.findOne({
      where: { slug: productSlug, status: ProductStatus.ACTIVE },
      relations: [
        "brand",
        "category",
        "media",
        "variants",
        "attributes",
        "attributes.attribute",
        "tags",
      ],
    });

    if (!product) {
      return sendNotFound(res, "Product");
    }

    // Get region-specific pricing
    const prRepo = AppDataSource.getRepository(ProductRegion);
    const productRegion = await prRepo.findOne({
      where: { productId: product.id, regionId: region.id },
    });

    // Merge region data
    const result = {
      ...product,
      regionPrice: productRegion?.price ? Number(productRegion.price) : Number(product.basePrice),
      regionComparePrice: productRegion?.compareAtPrice ? Number(productRegion.compareAtPrice) : null,
      regionStock: productRegion?.stockQuantity ?? null,
      isAvailableInRegion: productRegion?.isAvailable ?? true,
      promotionText: productRegion?.promotionText,
      shippingNote: productRegion?.shippingNote,
      deliveryDays: productRegion?.deliveryDays,
      region: {
        id: region.id,
        name: region.name,
        slug: region.slug,
        phone: region.phone,
        address: region.address,
      },
    };

    sendSuccess(res, result);
  } catch (error) {
    console.error("Error fetching product:", error);
    sendError(res, "Failed to fetch product");
  }
});

// ============================================
// CATEGORIES
// ============================================

/**
 * GET /api/public/categories
 */
router.get("/categories", async (_req: Request, res: Response) => {
  try {
    const categoryRepo = AppDataSource.getRepository(Category);
    const categories = await categoryRepo.find({
      where: { isActive: true },
      order: { displayOrder: "ASC" },
    });
    sendSuccess(res, categories);
  } catch (error) {
    sendError(res, "Failed to fetch categories");
  }
});

// ============================================
// ARTICLES
// ============================================

/**
 * GET /api/public/:regionSlug/articles
 */
router.get("/:regionSlug/articles", async (req: Request, res: Response) => {
  try {
    const { regionSlug } = req.params;
    const { page = 1, limit = 10, category } = req.query;

    const regionRepo = AppDataSource.getRepository(Region);
    const region = await regionRepo.findOne({
      where: { slug: regionSlug, isActive: true },
    });

    if (!region) {
      return sendNotFound(res, "Region");
    }

    const articleRepo = AppDataSource.getRepository(Article);
    const qb = articleRepo
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.category", "category")
      .where("a.status = :status", { status: ArticleStatus.PUBLISHED });

    if (category) {
      qb.andWhere("category.slug = :categorySlug", { categorySlug: category });
    }

    qb.orderBy("a.published_at", "DESC");

    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), 50);

    const [articles, total] = await qb
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getManyAndCount();

    const meta: PaginationMeta = {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    };
    sendSuccess(res, articles, undefined, meta);
  } catch (error) {
    sendError(res, "Failed to fetch articles");
  }
});

/**
 * GET /api/public/:regionSlug/articles/:articleSlug
 */
router.get("/:regionSlug/articles/:articleSlug", async (req: Request, res: Response) => {
  try {
    const { regionSlug, articleSlug } = req.params;

    const regionRepo = AppDataSource.getRepository(Region);
    const region = await regionRepo.findOne({
      where: { slug: regionSlug, isActive: true },
    });

    if (!region) {
      return sendNotFound(res, "Region");
    }

    const articleRepo = AppDataSource.getRepository(Article);
    const article = await articleRepo.findOne({
      where: { slug: articleSlug, status: ArticleStatus.PUBLISHED },
      relations: ["category", "tags"],
    });

    if (!article) {
      return sendNotFound(res, "Article");
    }

    await articleRepo.increment({ id: article.id }, "viewCount", 1);

    sendSuccess(res, {
      ...article,
      region: { name: region.name, phone: region.phone, address: region.address },
    });
  } catch (error) {
    sendError(res, "Failed to fetch article");
  }
});

/**
 * GET /api/public/:regionSlug/search
 */
router.get("/:regionSlug/search", async (req: Request, res: Response) => {
  try {
    const { regionSlug } = req.params;
    const { q, limit = 10 } = req.query;

    if (!q || String(q).length < 2) {
      return sendSuccess(res, { products: [], articles: [] });
    }

    const regionRepo = AppDataSource.getRepository(Region);
    const region = await regionRepo.findOne({
      where: { slug: regionSlug, isActive: true },
    });

    if (!region) {
      return sendNotFound(res, "Region");
    }

    const searchTerm = `%${q}%`;
    const limitNum = Math.min(Number(limit), 20);

    // Search products
    const productRepo = AppDataSource.getRepository(Product);
    const products = await productRepo
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.media", "media")
      .leftJoin(ProductRegion, "pr", "pr.product_id = p.id AND pr.region_id = :regionId", { regionId: region.id })
      .addSelect("COALESCE(pr.price, p.base_price) as region_price")
      .where("p.status = :status", { status: ProductStatus.ACTIVE })
      .andWhere("(p.name ILIKE :search OR p.spk ILIKE :search)", { search: searchTerm })
      .limit(limitNum)
      .getRawAndEntities();

    // Search articles
    const articleRepo = AppDataSource.getRepository(Article);
    const articles = await articleRepo.find({
      where: { title: Like(searchTerm), status: ArticleStatus.PUBLISHED },
      select: ["id", "title", "slug", "featuredImage"],
      take: limitNum,
    });

    sendSuccess(res, {
      products: products.entities.map((p, i) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        image: p.media?.[0]?.url,
        price: Number(products.raw[i].region_price || p.basePrice),
      })),
      articles,
    });
  } catch (error) {
    sendError(res, "Search failed");
  }
});

export default router;
