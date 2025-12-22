import { Router } from "express";
import { brandController } from "../controllers";

const router = Router();

router.get("/", (req, res) => brandController.getAll(req, res));
router.get("/active", (req, res) => brandController.getActive(req, res));
router.get("/:id", (req, res) => brandController.getById(req, res));
router.post("/", (req, res) => brandController.create(req, res));
router.put("/:id", (req, res) => brandController.update(req, res));
router.delete("/:id", (req, res) => brandController.delete(req, res));

export default router;
