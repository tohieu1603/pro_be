import { Router } from "express";
import { warehouseController } from "../controllers";

const router = Router();

router.get("/", (req, res) => warehouseController.getAll(req, res));
router.get("/active", (req, res) => warehouseController.getActive(req, res));
router.get("/:id", (req, res) => warehouseController.getById(req, res));
router.post("/", (req, res) => warehouseController.create(req, res));
router.put("/:id", (req, res) => warehouseController.update(req, res));
router.delete("/:id", (req, res) => warehouseController.delete(req, res));

export default router;
