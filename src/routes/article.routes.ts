import { Router } from "express";
import { articleController } from "../controllers";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public routes (read-only)
router.get("/", (req, res) => articleController.getAll(req, res));
router.get("/featured", (req, res) => articleController.getFeatured(req, res));
router.get("/recent", (req, res) => articleController.getRecent(req, res));
router.get("/category/:categoryId", (req, res) => articleController.getByCategory(req, res));
router.get("/slug/:slug", (req, res) => articleController.getBySlug(req, res));
router.get("/:id", (req, res) => articleController.getById(req, res));

// Protected routes (require authentication)
router.post("/", authenticate, (req, res) => articleController.create(req, res));
router.put("/:id", authenticate, (req, res) => articleController.update(req, res));
router.delete("/:id", authenticate, (req, res) => articleController.delete(req, res));
router.post("/:id/publish", authenticate, (req, res) => articleController.publish(req, res));
router.post("/:id/unpublish", authenticate, (req, res) => articleController.unpublish(req, res));
router.post("/:id/archive", authenticate, (req, res) => articleController.archive(req, res));

export default router;
