import { Router } from "express";
import { brandController } from "../controllers";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public routes (read-only)
router.get("/", (req, res) => brandController.getAll(req, res));
router.get("/active", (req, res) => brandController.getActive(req, res));
router.get("/:id", (req, res) => brandController.getById(req, res));

// Protected routes (require authentication)
router.post("/", authenticate, (req, res) => brandController.create(req, res));
router.put("/:id", authenticate, (req, res) => brandController.update(req, res));
router.delete("/:id", authenticate, (req, res) => brandController.delete(req, res));

export default router;
