import { Router } from "express";
import { inventoryController } from "../controllers";

const router = Router();

router.get("/", (req, res) => inventoryController.getAll(req, res));
router.get("/low-stock", (req, res) => inventoryController.getLowStock(req, res));
router.get("/movements", (req, res) => inventoryController.getMovementHistory(req, res));
router.get("/variant/:variantId", (req, res) => inventoryController.getByVariant(req, res));
router.get("/warehouse/:warehouseId", (req, res) => inventoryController.getByWarehouse(req, res));
router.post("/update", (req, res) => inventoryController.updateInventory(req, res));
router.post("/transfer", (req, res) => inventoryController.transferInventory(req, res));
router.post("/reserve", (req, res) => inventoryController.reserveStock(req, res));
router.post("/release", (req, res) => inventoryController.releaseReservedStock(req, res));

export default router;
