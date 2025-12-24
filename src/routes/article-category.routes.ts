import { Router } from "express";
import { articleCategoryController } from "../controllers";

const router = Router();

router.get("/", (req, res) => articleCategoryController.getAll(req, res));
router.get("/tree", (req, res) => articleCategoryController.getTree(req, res));
router.get("/active", (req, res) => articleCategoryController.getActive(req, res));
router.get("/slug/:slug", (req, res) => articleCategoryController.getBySlug(req, res));
router.get("/:id", (req, res) => articleCategoryController.getById(req, res));
router.post("/", (req, res) => articleCategoryController.create(req, res));
router.put("/:id", (req, res) => articleCategoryController.update(req, res));
router.delete("/:id", (req, res) => articleCategoryController.delete(req, res));

export default router;
