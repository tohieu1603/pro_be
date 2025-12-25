import { Router } from "express";
import { articleCategoryController } from "../controllers";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public routes (read-only)
router.get("/", (req, res) => articleCategoryController.getAll(req, res));
router.get("/tree", (req, res) => articleCategoryController.getTree(req, res));
router.get("/active", (req, res) => articleCategoryController.getActive(req, res));
router.get("/slug/:slug", (req, res) => articleCategoryController.getBySlug(req, res));
router.get("/:id", (req, res) => articleCategoryController.getById(req, res));

// Protected routes (require authentication)
router.post("/", authenticate, (req, res) => articleCategoryController.create(req, res));
router.put("/:id", authenticate, (req, res) => articleCategoryController.update(req, res));
router.delete("/:id", authenticate, (req, res) => articleCategoryController.delete(req, res));

export default router;
