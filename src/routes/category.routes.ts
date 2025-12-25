import { Router } from "express";
import { categoryController } from "../controllers";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public routes (read-only)
router.get("/", (req, res) => categoryController.getAll(req, res));
router.get("/tree", (req, res) => categoryController.getTree(req, res));
router.get("/active", (req, res) => categoryController.getActive(req, res));
router.get("/:id", (req, res) => categoryController.getById(req, res));

// Protected routes (require authentication)
router.post("/", authenticate, (req, res) => categoryController.create(req, res));
router.put("/:id", authenticate, (req, res) => categoryController.update(req, res));
router.delete("/:id", authenticate, (req, res) => categoryController.delete(req, res));

export default router;
