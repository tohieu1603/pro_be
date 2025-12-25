import { Router } from "express";
import { productVariantController } from "../controllers";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public routes (read-only)
router.get("/", (req, res) => productVariantController.getAll(req, res));
router.get("/low-stock", (req, res) => productVariantController.getLowStock(req, res));
router.get("/product/:productId", (req, res) => productVariantController.getByProduct(req, res));
router.get("/sku/:sku", (req, res) => productVariantController.getBySKU(req, res));
router.get("/:id", (req, res) => productVariantController.getById(req, res));

// Protected routes (require authentication)
router.post("/", authenticate, (req, res) => productVariantController.create(req, res));
router.put("/:id", authenticate, (req, res) => productVariantController.update(req, res));
router.delete("/:id", authenticate, (req, res) => productVariantController.delete(req, res));
router.post("/set-default", authenticate, (req, res) => productVariantController.setDefault(req, res));
router.put("/:id/stock", authenticate, (req, res) => productVariantController.updateStock(req, res));

export default router;
