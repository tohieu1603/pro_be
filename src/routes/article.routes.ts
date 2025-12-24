import { Router } from "express";
import { articleController } from "../controllers";

const router = Router();

// List and query routes
router.get("/", (req, res) => articleController.getAll(req, res));
router.get("/featured", (req, res) => articleController.getFeatured(req, res));
router.get("/recent", (req, res) => articleController.getRecent(req, res));
router.get("/category/:categoryId", (req, res) => articleController.getByCategory(req, res));

// Slug route
router.get("/slug/:slug", (req, res) => articleController.getBySlug(req, res));

// CRUD routes
router.get("/:id", (req, res) => articleController.getById(req, res));
router.post("/", (req, res) => articleController.create(req, res));
router.put("/:id", (req, res) => articleController.update(req, res));
router.delete("/:id", (req, res) => articleController.delete(req, res));

// Status routes
router.post("/:id/publish", (req, res) => articleController.publish(req, res));
router.post("/:id/unpublish", (req, res) => articleController.unpublish(req, res));
router.post("/:id/archive", (req, res) => articleController.archive(req, res));

export default router;
