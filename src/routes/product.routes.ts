import { Router } from "express";
import { productController } from "../controllers";

const router = Router();

router.get("/", (req, res) => productController.getAll(req, res));
router.get("/featured", (req, res) => productController.getFeatured(req, res));
router.get("/promotions", (req, res) => productController.getAllPromotions(req, res));
router.get("/services", (req, res) => productController.getAllServices(req, res));
router.get("/slug/:slug", (req, res) => productController.getBySlug(req, res));
router.get("/:id", (req, res) => productController.getById(req, res));
router.get("/:id/promotions", (req, res) => productController.getPromotions(req, res));
router.get("/:id/services", (req, res) => productController.getServices(req, res));
router.post("/", (req, res) => productController.create(req, res));
router.put("/:id", (req, res) => productController.update(req, res));
router.delete("/:id", (req, res) => productController.delete(req, res));
router.post("/:id/publish", (req, res) => productController.publish(req, res));
router.post("/:id/unpublish", (req, res) => productController.unpublish(req, res));
router.put("/:id/tags", (req, res) => productController.updateTags(req, res));
router.put("/:id/media", (req, res) => productController.updateMedia(req, res));

export default router;
