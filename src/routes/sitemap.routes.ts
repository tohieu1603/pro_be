import { Router, Request, Response } from "express";
import { sitemapService, seoSettingsService } from "../services";
import { extractSubdomain } from "../utils/multi-tenant";

const router = Router();

// Master sitemap index (for main domain - lists all region sitemaps)
router.get("/sitemap-master.xml", async (req: Request, res: Response) => {
  try {
    const host = req.get("host") || "";
    const baseDomain = host.split(":")[0]; // Remove port if present
    const xml = await sitemapService.generateMasterSitemapIndex(baseDomain);

    res.header("Content-Type", "application/xml");
    res.header("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (error) {
    console.error("Error generating master sitemap:", error);
    res.status(500).send("Error generating master sitemap");
  }
});

// Main sitemap - serves region-specific if subdomain detected
router.get("/sitemap.xml", async (req: Request, res: Response) => {
  try {
    const host = req.get("host") || "";
    const subdomain = extractSubdomain(host);

    let xml: string;
    if (subdomain) {
      // Region-specific sitemap
      const baseDomain = host.replace(`${subdomain}.`, "").split(":")[0];
      xml = await sitemapService.generateRegionSitemap(subdomain, baseDomain);
    } else {
      // Main domain sitemap
      const baseUrl = `${req.protocol}://${host}`;
      xml = await sitemapService.generateSitemap({ baseUrl });
    }

    res.header("Content-Type", "application/xml");
    res.header("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
});

// Sitemap index (for large sites)
router.get("/sitemap-index.xml", async (req: Request, res: Response) => {
  try {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const xml = await sitemapService.generateSitemapIndex(baseUrl);

    res.header("Content-Type", "application/xml");
    res.header("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (error) {
    console.error("Error generating sitemap index:", error);
    res.status(500).send("Error generating sitemap index");
  }
});

// Products sitemap
router.get("/sitemap-products.xml", async (req: Request, res: Response) => {
  try {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const xml = await sitemapService.generateProductsSitemap(baseUrl);

    res.header("Content-Type", "application/xml");
    res.header("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (error) {
    console.error("Error generating products sitemap:", error);
    res.status(500).send("Error generating products sitemap");
  }
});

// Articles sitemap
router.get("/sitemap-articles.xml", async (req: Request, res: Response) => {
  try {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const xml = await sitemapService.generateArticlesSitemap(baseUrl);

    res.header("Content-Type", "application/xml");
    res.header("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (error) {
    console.error("Error generating articles sitemap:", error);
    res.status(500).send("Error generating articles sitemap");
  }
});

// Categories sitemap
router.get("/sitemap-categories.xml", async (req: Request, res: Response) => {
  try {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const xml = await sitemapService.generateCategoriesSitemap(baseUrl);

    res.header("Content-Type", "application/xml");
    res.header("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (error) {
    console.error("Error generating categories sitemap:", error);
    res.status(500).send("Error generating categories sitemap");
  }
});

// robots.txt - region-aware, uses DB settings
router.get("/robots.txt", async (req: Request, res: Response) => {
  try {
    const host = req.get("host") || "";
    const subdomain = extractSubdomain(host);
    const baseUrl = `${req.protocol}://${host}`;

    // Get robots.txt from DB, fallback to default
    let robotsTxt = await seoSettingsService.getRobotsTxt();

    // Replace placeholder with actual base URL
    robotsTxt = robotsTxt.replace(/\{\{BASE_URL\}\}/g, baseUrl);

    // If main domain, also include master sitemap
    if (!subdomain && !robotsTxt.includes("sitemap-master.xml")) {
      robotsTxt = robotsTxt.replace(
        `Sitemap: ${baseUrl}/sitemap.xml`,
        `Sitemap: ${baseUrl}/sitemap.xml\nSitemap: ${baseUrl}/sitemap-master.xml`
      );
    }

    res.header("Content-Type", "text/plain");
    res.header("Cache-Control", "public, max-age=86400");
    res.send(robotsTxt);
  } catch (error) {
    console.error("Error generating robots.txt:", error);
    res.status(500).send("Error generating robots.txt");
  }
});

export default router;
