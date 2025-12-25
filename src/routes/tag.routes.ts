import { Router } from "express";
import { tagController } from "../controllers";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public routes (read-only)
router.get("/", (req, res) => tagController.getAll(req, res));
router.get("/type/:type", (req, res) => tagController.getByType(req, res));
router.get("/:id", (req, res) => tagController.getById(req, res));

// Protected routes (require authentication)
router.post("/", authenticate, (req, res) => tagController.create(req, res));
router.put("/:id", authenticate, (req, res) => tagController.update(req, res));
router.delete("/:id", authenticate, (req, res) => tagController.delete(req, res));

export default router;
