import { Router } from "express";
import { seoSettingsController } from "../controllers";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All SEO settings routes require authentication
router.use(authenticate);

// Get all SEO settings
router.get("/", (req, res) => seoSettingsController.getAll(req, res));

// Robots.txt management
router.get("/robots", (req, res) => seoSettingsController.getRobotsTxt(req, res));
router.put("/robots", (req, res) => seoSettingsController.updateRobotsTxt(req, res));

// Sitemap config management
router.get("/sitemap-config", (req, res) => seoSettingsController.getSitemapConfig(req, res));
router.put("/sitemap-config", (req, res) => seoSettingsController.updateSitemapConfig(req, res));

// Sitemap utilities
router.post("/sitemap-preview", (req, res) => seoSettingsController.previewSitemap(req, res));
router.get("/sitemap-stats", (req, res) => seoSettingsController.getSitemapStats(req, res));

export default router;
