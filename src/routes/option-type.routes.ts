import { Router } from "express";
import { optionTypeController } from "../controllers";

const router = Router();

// Option Types
router.get("/", (req, res) => optionTypeController.getAll(req, res));
router.get("/category/:categoryId", (req, res) => optionTypeController.getByCategory(req, res));
router.get("/:id", (req, res) => optionTypeController.getById(req, res));
router.post("/", (req, res) => optionTypeController.create(req, res));
router.put("/:id", (req, res) => optionTypeController.update(req, res));
router.delete("/:id", (req, res) => optionTypeController.delete(req, res));

// Option Values
router.get("/:optionTypeId/values", (req, res) => optionTypeController.getValues(req, res));
router.post("/:optionTypeId/values", (req, res) => optionTypeController.createValue(req, res));
router.post("/:optionTypeId/values/bulk", (req, res) => optionTypeController.createValues(req, res));
router.post("/:optionTypeId/values/find-or-create", (req, res) => optionTypeController.findOrCreateValues(req, res));
router.put("/:optionTypeId/values/:valueId", (req, res) => optionTypeController.updateValue(req, res));
router.delete("/:optionTypeId/values/:valueId", (req, res) => optionTypeController.deleteValue(req, res));

export default router;
