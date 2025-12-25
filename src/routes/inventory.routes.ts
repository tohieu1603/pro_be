import { Router } from "express";
import { inventoryController } from "../controllers";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Protected routes (all inventory operations require authentication)
router.get("/", authenticate, (req, res) => inventoryController.getAll(req, res));
router.get("/low-stock", authenticate, (req, res) => inventoryController.getLowStock(req, res));
router.get("/movements", authenticate, (req, res) => inventoryController.getMovementHistory(req, res));
router.get("/variant/:variantId", authenticate, (req, res) => inventoryController.getByVariant(req, res));
router.get("/warehouse/:warehouseId", authenticate, (req, res) => inventoryController.getByWarehouse(req, res));
router.post("/update", authenticate, (req, res) => inventoryController.updateInventory(req, res));
router.post("/transfer", authenticate, (req, res) => inventoryController.transferInventory(req, res));
router.post("/reserve", authenticate, (req, res) => inventoryController.reserveStock(req, res));
router.post("/release", authenticate, (req, res) => inventoryController.releaseReservedStock(req, res));

export default router;
