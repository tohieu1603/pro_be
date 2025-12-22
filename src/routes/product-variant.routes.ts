import { Router } from "express";
import { productVariantController } from "../controllers";

const router = Router();

router.get("/", (req, res) => productVariantController.getAll(req, res));
router.get("/low-stock", (req, res) => productVariantController.getLowStock(req, res));
router.get("/product/:productId", (req, res) => productVariantController.getByProduct(req, res));
router.get("/sku/:sku", (req, res) => productVariantController.getBySKU(req, res));
router.get("/:id", (req, res) => productVariantController.getById(req, res));
router.post("/", (req, res) => productVariantController.create(req, res));
router.put("/:id", (req, res) => productVariantController.update(req, res));
router.delete("/:id", (req, res) => productVariantController.delete(req, res));
router.post("/set-default", (req, res) => productVariantController.setDefault(req, res));
router.put("/:id/stock", (req, res) => productVariantController.updateStock(req, res));

export default router;
