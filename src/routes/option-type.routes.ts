import { Router } from "express";
import { optionTypeController } from "../controllers";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public routes (read-only)
router.get("/", (req, res) => optionTypeController.getAll(req, res));
router.get("/category/:categoryId", (req, res) => optionTypeController.getByCategory(req, res));
router.get("/:id", (req, res) => optionTypeController.getById(req, res));
router.get("/:optionTypeId/values", (req, res) => optionTypeController.getValues(req, res));

// Protected routes (require authentication)
router.post("/", authenticate, (req, res) => optionTypeController.create(req, res));
router.put("/:id", authenticate, (req, res) => optionTypeController.update(req, res));
router.delete("/:id", authenticate, (req, res) => optionTypeController.delete(req, res));
router.post("/:optionTypeId/values", authenticate, (req, res) => optionTypeController.createValue(req, res));
router.post("/:optionTypeId/values/bulk", authenticate, (req, res) => optionTypeController.createValues(req, res));
router.post("/:optionTypeId/values/find-or-create", authenticate, (req, res) => optionTypeController.findOrCreateValues(req, res));
router.put("/:optionTypeId/values/:valueId", authenticate, (req, res) => optionTypeController.updateValue(req, res));
router.delete("/:optionTypeId/values/:valueId", authenticate, (req, res) => optionTypeController.deleteValue(req, res));

export default router;
