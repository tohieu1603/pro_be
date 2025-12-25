import { Router } from "express";
import { productController } from "../controllers";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public routes (read-only)
router.get("/", (req, res) => productController.getAll(req, res));
router.get("/featured", (req, res) => productController.getFeatured(req, res));
router.get("/promotions", (req, res) => productController.getAllPromotions(req, res));
router.get("/services", (req, res) => productController.getAllServices(req, res));
router.get("/slug/:slug", (req, res) => productController.getBySlug(req, res));
router.get("/:id", (req, res) => productController.getById(req, res));
router.get("/:id/promotions", (req, res) => productController.getPromotions(req, res));
router.get("/:id/services", (req, res) => productController.getServices(req, res));

// Protected routes (require authentication)
router.post("/", authenticate, (req, res) => productController.create(req, res));
router.put("/:id", authenticate, (req, res) => productController.update(req, res));
router.delete("/:id", authenticate, (req, res) => productController.delete(req, res));
router.post("/:id/publish", authenticate, (req, res) => productController.publish(req, res));
router.post("/:id/unpublish", authenticate, (req, res) => productController.unpublish(req, res));
router.put("/:id/tags", authenticate, (req, res) => productController.updateTags(req, res));
router.put("/:id/media", authenticate, (req, res) => productController.updateMedia(req, res));

export default router;
