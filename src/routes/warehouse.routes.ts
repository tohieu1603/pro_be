import { Router } from "express";
import { warehouseController } from "../controllers";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public routes (read-only)
router.get("/", (req, res) => warehouseController.getAll(req, res));
router.get("/active", (req, res) => warehouseController.getActive(req, res));
router.get("/:id", (req, res) => warehouseController.getById(req, res));

// Protected routes (require authentication)
router.post("/", authenticate, (req, res) => warehouseController.create(req, res));
router.put("/:id", authenticate, (req, res) => warehouseController.update(req, res));
router.delete("/:id", authenticate, (req, res) => warehouseController.delete(req, res));

export default router;
