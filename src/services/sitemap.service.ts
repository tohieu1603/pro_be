import { AppDataSource } from "../data-source";
import { Article, ArticleStatus, Product, ProductStatus, ArticleCategory, Category, Region } from "../entities";

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

export interface SitemapConfig {
  baseUrl: string;
  baseDomain?: string; // For multi-region (e.g., "dieuhoaxyz.vn")
  regionSubdomain?: string; // Current region subdomain
  includeProducts?: boolean;
  includeArticles?: boolean;
  includeCategories?: boolean;
  includeArticleCategories?: boolean;
  includeRegions?: boolean;
}

export class SitemapService {
  private defaultBaseUrl = process.env.SITE_URL || "https://example.com";
  private defaultBaseDomain = process.env.BASE_DOMAIN || "example.com";

  /**
   * Generate full sitemap XML
   */
  async generateSitemap(config?: Partial<SitemapConfig>): Promise<string> {
    const baseUrl = config?.baseUrl || this.defaultBaseUrl;
    const urls: SitemapUrl[] = [];

    // Static pages
    urls.push(
      { loc: baseUrl, changefreq: "daily", priority: 1.0 },
      { loc: `${baseUrl}/products`, changefreq: "daily", priority: 0.9 },
      { loc: `${baseUrl}/articles`, changefreq: "daily", priority: 0.9 },
      { loc: `${baseUrl}/contact`, changefreq: "monthly", priority: 0.5 }
    );

    // Products
    if (config?.includeProducts !== false) {
      const products = await this.getPublishedProducts();
      products.forEach((product) => {
        urls.push({
          loc: `${baseUrl}/products/${product.slug}`,
          lastmod: product.updatedAt.toISOString(),
          changefreq: "weekly",
          priority: 0.8,
        });
      });
    }

    // Product Categories
    if (config?.includeCategories !== false) {
      const categories = await this.getActiveProductCategories();
      categories.forEach((category) => {
        urls.push({
          loc: `${baseUrl}/categories/${category.slug}`,
          lastmod: category.updatedAt.toISOString(),
          changefreq: "weekly",
          priority: 0.7,
        });
      });
    }

    // Articles
    if (config?.includeArticles !== false) {
      const articles = await this.getPublishedArticles();
      articles.forEach((article) => {
        urls.push({
          loc: `${baseUrl}/articles/${article.slug}`,
          lastmod: article.updatedAt.toISOString(),
          changefreq: "weekly",
          priority: 0.7,
        });
      });
    }

    // Article Categories
    if (config?.includeArticleCategories !== false) {
      const articleCategories = await this.getActiveArticleCategories();
      articleCategories.forEach((category) => {
        urls.push({
          loc: `${baseUrl}/articles/category/${category.slug}`,
          lastmod: category.updatedAt.toISOString(),
          changefreq: "weekly",
          priority: 0.6,
        });
      });
    }

    return this.buildSitemapXml(urls);
  }

  /**
   * Generate master sitemap index for all regions
   */
  async generateMasterSitemapIndex(baseDomain?: string): Promise<string> {
    const domain = baseDomain || this.defaultBaseDomain;
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const now = new Date().toISOString();

    const regions = await this.getActiveRegions();
    const sitemaps: { loc: string; lastmod: string }[] = [];

    // Add main domain sitemap
    sitemaps.push({
      loc: `${protocol}://${domain}/sitemap.xml`,
      lastmod: now,
    });

    // Add each region's sitemap
    for (const region of regions) {
      sitemaps.push({
        loc: `${protocol}://${region.subdomain}.${domain}/sitemap.xml`,
        lastmod: region.updatedAt.toISOString(),
      });
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const sitemap of sitemaps) {
      xml += "  <sitemap>\n";
      xml += `    <loc>${this.escapeXml(sitemap.loc)}</loc>\n`;
      xml += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
      xml += "  </sitemap>\n";
    }

    xml += "</sitemapindex>";
    return xml;
  }

  /**
   * Generate sitemap for a specific region
   */
  async generateRegionSitemap(regionSubdomain: string, baseDomain?: string): Promise<string> {
    const domain = baseDomain || this.defaultBaseDomain;
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const baseUrl = `${protocol}://${regionSubdomain}.${domain}`;

    return this.generateSitemap({ baseUrl });
  }

  /**
   * Generate sitemap index for large sites
   */
  async generateSitemapIndex(baseUrl?: string): Promise<string> {
    const url = baseUrl || this.defaultBaseUrl;
    const now = new Date().toISOString();

    const sitemaps = [
      { loc: `${url}/sitemap-products.xml`, lastmod: now },
      { loc: `${url}/sitemap-articles.xml`, lastmod: now },
      { loc: `${url}/sitemap-categories.xml`, lastmod: now },
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const sitemap of sitemaps) {
      xml += "  <sitemap>\n";
      xml += `    <loc>${this.escapeXml(sitemap.loc)}</loc>\n`;
      xml += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
      xml += "  </sitemap>\n";
    }

    xml += "</sitemapindex>";
    return xml;
  }

  /**
   * Generate products sitemap
   */
  async generateProductsSitemap(baseUrl?: string): Promise<string> {
    const url = baseUrl || this.defaultBaseUrl;
    const products = await this.getPublishedProducts();

    const urls: SitemapUrl[] = products.map((product) => ({
      loc: `${url}/products/${product.slug}`,
      lastmod: product.updatedAt.toISOString(),
      changefreq: "weekly" as const,
      priority: 0.8,
    }));

    return this.buildSitemapXml(urls);
  }

  /**
   * Generate articles sitemap
   */
  async generateArticlesSitemap(baseUrl?: string): Promise<string> {
    const url = baseUrl || this.defaultBaseUrl;
    const articles = await this.getPublishedArticles();

    const urls: SitemapUrl[] = articles.map((article) => ({
      loc: `${url}/articles/${article.slug}`,
      lastmod: article.updatedAt.toISOString(),
      changefreq: "weekly" as const,
      priority: 0.7,
    }));

    return this.buildSitemapXml(urls);
  }

  /**
   * Generate categories sitemap
   */
  async generateCategoriesSitemap(baseUrl?: string): Promise<string> {
    const url = baseUrl || this.defaultBaseUrl;
    const urls: SitemapUrl[] = [];

    // Product categories
    const productCategories = await this.getActiveProductCategories();
    productCategories.forEach((category) => {
      urls.push({
        loc: `${url}/categories/${category.slug}`,
        lastmod: category.updatedAt.toISOString(),
        changefreq: "weekly",
        priority: 0.7,
      });
    });

    // Article categories
    const articleCategories = await this.getActiveArticleCategories();
    articleCategories.forEach((category) => {
      urls.push({
        loc: `${url}/articles/category/${category.slug}`,
        lastmod: category.updatedAt.toISOString(),
        changefreq: "weekly",
        priority: 0.6,
      });
    });

    return this.buildSitemapXml(urls);
  }

  /**
   * Generate robots.txt
   */
  generateRobotsTxt(baseUrl?: string): string {
    const url = baseUrl || this.defaultBaseUrl;

    return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${url}/sitemap.xml

# Disallow admin and API
Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /register
`;
  }

  // Private helper methods

  private async getPublishedProducts(): Promise<Product[]> {
    return AppDataSource.getRepository(Product).find({
      where: { status: ProductStatus.ACTIVE },
      select: ["id", "slug", "updatedAt"],
      order: { updatedAt: "DESC" },
    });
  }

  private async getPublishedArticles(): Promise<Article[]> {
    return AppDataSource.getRepository(Article).find({
      where: {
        status: ArticleStatus.PUBLISHED,
        robotsIndex: true,
      },
      select: ["id", "slug", "updatedAt"],
      order: { publishedAt: "DESC" },
    });
  }

  private async getActiveProductCategories(): Promise<Category[]> {
    return AppDataSource.getRepository(Category).find({
      where: { isActive: true },
      select: ["id", "slug", "updatedAt"],
      order: { displayOrder: "ASC" },
    });
  }

  private async getActiveArticleCategories(): Promise<ArticleCategory[]> {
    return AppDataSource.getRepository(ArticleCategory).find({
      where: { isActive: true },
      select: ["id", "slug", "updatedAt"],
      order: { displayOrder: "ASC" },
    });
  }

  private async getActiveRegions(): Promise<Region[]> {
    return AppDataSource.getRepository(Region).find({
      where: { isActive: true },
      select: ["id", "subdomain", "slug", "updatedAt"],
      order: { displayOrder: "ASC" },
    });
  }

  private buildSitemapXml(urls: SitemapUrl[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const url of urls) {
      xml += "  <url>\n";
      xml += `    <loc>${this.escapeXml(url.loc)}</loc>\n`;
      if (url.lastmod) {
        xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      }
      if (url.changefreq) {
        xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      }
      if (url.priority !== undefined) {
        xml += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
      }
      xml += "  </url>\n";
    }

    xml += "</urlset>";
    return xml;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}

export const sitemapService = new SitemapService();
