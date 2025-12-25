import { AppDataSource } from "../data-source";
import { SeoSettings } from "../entities";

export interface SeoSitemapConfig {
  includeProducts: boolean;
  includeArticles: boolean;
  includeCategories: boolean;
  includeArticleCategories: boolean;
  productChangefreq: string;
  articleChangefreq: string;
  categoryChangefreq: string;
  productPriority: number;
  articlePriority: number;
  categoryPriority: number;
}

const DEFAULT_ROBOTS_TXT = `User-agent: *
Allow: /

# Sitemaps
Sitemap: {{BASE_URL}}/sitemap.xml

# Disallow admin and API
Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /register
`;

const DEFAULT_SITEMAP_CONFIG: SeoSitemapConfig = {
  includeProducts: true,
  includeArticles: true,
  includeCategories: true,
  includeArticleCategories: true,
  productChangefreq: "weekly",
  articleChangefreq: "weekly",
  categoryChangefreq: "monthly",
  productPriority: 0.8,
  articlePriority: 0.7,
  categoryPriority: 0.6,
};

export class SeoSettingsService {
  private repo = AppDataSource.getRepository(SeoSettings);

  async getByKey(key: string): Promise<SeoSettings | null> {
    return this.repo.findOne({ where: { key } });
  }

  async upsert(key: string, value: string, description?: string): Promise<SeoSettings> {
    let setting = await this.repo.findOne({ where: { key } });

    if (setting) {
      setting.value = value;
      if (description) setting.description = description;
    } else {
      setting = this.repo.create({ key, value, description });
    }

    return this.repo.save(setting);
  }

  async getAll(): Promise<SeoSettings[]> {
    return this.repo.find({ order: { key: "ASC" } });
  }

  // Robots.txt management
  async getRobotsTxt(): Promise<string> {
    const setting = await this.getByKey("robots_txt");
    return setting?.value || DEFAULT_ROBOTS_TXT;
  }

  async updateRobotsTxt(content: string): Promise<SeoSettings> {
    return this.upsert("robots_txt", content, "Custom robots.txt content");
  }

  // Sitemap config management
  async getSeoSitemapConfig(): Promise<SeoSitemapConfig> {
    const setting = await this.getByKey("sitemap_config");
    if (setting?.value) {
      try {
        return { ...DEFAULT_SITEMAP_CONFIG, ...JSON.parse(setting.value) };
      } catch {
        return DEFAULT_SITEMAP_CONFIG;
      }
    }
    return DEFAULT_SITEMAP_CONFIG;
  }

  async updateSeoSitemapConfig(config: Partial<SeoSitemapConfig>): Promise<SeoSettings> {
    const current = await this.getSeoSitemapConfig();
    const merged = { ...current, ...config };
    return this.upsert("sitemap_config", JSON.stringify(merged), "Sitemap generation configuration");
  }

  // Initialize default settings
  async initDefaults(): Promise<void> {
    const robotsSetting = await this.getByKey("robots_txt");
    if (!robotsSetting) {
      await this.upsert("robots_txt", DEFAULT_ROBOTS_TXT, "Custom robots.txt content");
    }

    const sitemapSetting = await this.getByKey("sitemap_config");
    if (!sitemapSetting) {
      await this.upsert("sitemap_config", JSON.stringify(DEFAULT_SITEMAP_CONFIG), "Sitemap generation configuration");
    }
  }
}

export const seoSettingsService = new SeoSettingsService();
