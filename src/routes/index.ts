import { Router } from "express";
import brandRoutes from "./brand.routes";
import categoryRoutes from "./category.routes";
import productRoutes from "./product.routes";
import productVariantRoutes from "./product-variant.routes";
import warehouseRoutes from "./warehouse.routes";
import inventoryRoutes from "./inventory.routes";
import tagRoutes from "./tag.routes";
import optionTypeRoutes from "./option-type.routes";
import importRoutes from "./import.routes";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/brands", brandRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/variants", productVariantRoutes);
router.use("/warehouses", warehouseRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/tags", tagRoutes);
router.use("/option-types", optionTypeRoutes);
router.use("/import", importRoutes);

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
