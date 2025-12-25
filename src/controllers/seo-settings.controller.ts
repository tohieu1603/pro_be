import { Request, Response } from "express";
import { seoSettingsService, sitemapService } from "../services";
import { sendSuccess, sendError } from "../utils/api-response";

export class SeoSettingsController {
  // Get all SEO settings
  async getAll(req: Request, res: Response) {
    try {
      const settings = await seoSettingsService.getAll();
      return sendSuccess(res, settings);
    } catch (error) {
      return sendError(res, "Failed to fetch SEO settings", 500);
    }
  }

  // Get robots.txt content
  async getRobotsTxt(req: Request, res: Response) {
    try {
      const content = await seoSettingsService.getRobotsTxt();
      return sendSuccess(res, { content });
    } catch (error) {
      return sendError(res, "Failed to fetch robots.txt", 500);
    }
  }

  // Update robots.txt content
  async updateRobotsTxt(req: Request, res: Response) {
    try {
      const { content } = req.body;
      if (typeof content !== "string") {
        return sendError(res, "Content must be a string", 400);
      }
      const setting = await seoSettingsService.updateRobotsTxt(content);
      return sendSuccess(res, setting, "robots.txt updated successfully");
    } catch (error) {
      return sendError(res, "Failed to update robots.txt", 500);
    }
  }

  // Get sitemap config
  async getSitemapConfig(req: Request, res: Response) {
    try {
      const config = await seoSettingsService.getSeoSitemapConfig();
      return sendSuccess(res, config);
    } catch (error) {
      return sendError(res, "Failed to fetch sitemap config", 500);
    }
  }

  // Update sitemap config
  async updateSitemapConfig(req: Request, res: Response) {
    try {
      const setting = await seoSettingsService.updateSeoSitemapConfig(req.body);
      return sendSuccess(res, setting, "Sitemap config updated successfully");
    } catch (error) {
      return sendError(res, "Failed to update sitemap config", 500);
    }
  }

  // Preview sitemap XML
  async previewSitemap(req: Request, res: Response) {
    try {
      const baseUrl = req.body.baseUrl || `${req.protocol}://${req.get("host")}`;
      const xml = await sitemapService.generateSitemap({ baseUrl });
      return sendSuccess(res, { xml });
    } catch (error) {
      return sendError(res, "Failed to generate sitemap preview", 500);
    }
  }

  // Get sitemap stats
  async getSitemapStats(req: Request, res: Response) {
    try {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const [productsXml, articlesXml, categoriesXml] = await Promise.all([
        sitemapService.generateProductsSitemap(baseUrl),
        sitemapService.generateArticlesSitemap(baseUrl),
        sitemapService.generateCategoriesSitemap(baseUrl),
      ]);

      // Count URLs in each sitemap
      const countUrls = (xml: string) => (xml.match(/<url>/g) || []).length;

      return sendSuccess(res, {
        products: countUrls(productsXml),
        articles: countUrls(articlesXml),
        categories: countUrls(categoriesXml),
        total: countUrls(productsXml) + countUrls(articlesXml) + countUrls(categoriesXml),
      });
    } catch (error) {
      return sendError(res, "Failed to get sitemap stats", 500);
    }
  }
}

export const seoSettingsController = new SeoSettingsController();
