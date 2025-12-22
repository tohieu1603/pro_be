import { Router } from "express";
import { tagController } from "../controllers";

const router = Router();

router.get("/", (req, res) => tagController.getAll(req, res));
router.get("/type/:type", (req, res) => tagController.getByType(req, res));
router.get("/:id", (req, res) => tagController.getById(req, res));
router.post("/", (req, res) => tagController.create(req, res));
router.put("/:id", (req, res) => tagController.update(req, res));
router.delete("/:id", (req, res) => tagController.delete(req, res));

export default router;
