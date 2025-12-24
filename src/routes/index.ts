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
import articleCategoryRoutes from "./article-category.routes";
import articleRoutes from "./article.routes";
import regionRoutes from "./region.routes";
import publicRoutes from "./public.routes";

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
router.use("/article-categories", articleCategoryRoutes);
router.use("/articles", articleRoutes);
router.use("/regions", regionRoutes);
router.use("/public", publicRoutes);

// Health check
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
