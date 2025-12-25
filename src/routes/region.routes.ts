import { Router } from "express";
import { regionController, productRegionController } from "../controllers";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public routes (read-only)
router.get("/", (req, res) => regionController.getAll(req, res));
router.get("/active", (req, res) => regionController.getActive(req, res));
router.get("/current", (req, res) => regionController.getCurrent(req, res));
router.get("/slug/:slug", (req, res) => regionController.getBySlug(req, res));
router.get("/subdomain/:subdomain", (req, res) => regionController.getBySubdomain(req, res));
router.get("/:id", (req, res) => regionController.getById(req, res));
router.get("/:regionId/products", (req, res) => productRegionController.getByRegion(req, res));
router.get("/:regionId/products/low-stock", (req, res) => productRegionController.getLowStock(req, res));
router.get("/:regionId/products/:productId", (req, res) => productRegionController.getByProductAndRegion(req, res));
router.get("/product/:productId/regions", (req, res) => productRegionController.getByProduct(req, res));

// Protected routes (require authentication)
router.post("/", authenticate, (req, res) => regionController.create(req, res));
router.put("/:id", authenticate, (req, res) => regionController.update(req, res));
router.delete("/:id", authenticate, (req, res) => regionController.delete(req, res));
router.post("/:id/set-default", authenticate, (req, res) => regionController.setDefault(req, res));
router.delete("/:regionId/products/:productId", authenticate, (req, res) => productRegionController.removeFromRegion(req, res));
router.post("/product-regions", authenticate, (req, res) => productRegionController.upsert(req, res));
router.post("/product-regions/bulk-availability", authenticate, (req, res) => productRegionController.bulkUpdateAvailability(req, res));
router.post("/product-regions/copy", authenticate, (req, res) => productRegionController.copyFromRegion(req, res));

export default router;
