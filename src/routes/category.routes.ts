import { Router } from "express";
import { categoryController } from "../controllers";

const router = Router();

router.get("/", (req, res) => categoryController.getAll(req, res));
router.get("/tree", (req, res) => categoryController.getTree(req, res));
router.get("/active", (req, res) => categoryController.getActive(req, res));
router.get("/:id", (req, res) => categoryController.getById(req, res));
router.post("/", (req, res) => categoryController.create(req, res));
router.put("/:id", (req, res) => categoryController.update(req, res));
router.delete("/:id", (req, res) => categoryController.delete(req, res));

export default router;
