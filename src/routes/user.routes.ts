import { Router, Request, Response } from "express";
import { userController } from "../controllers/user.controller";
import { adminOnly } from "../middleware/auth.middleware";

const router = Router();

// All routes require admin authentication
router.get("/", adminOnly, (req: Request, res: Response) => userController.getAll(req, res));
router.get("/:id", adminOnly, (req: Request, res: Response) => userController.getById(req, res));
router.post("/", adminOnly, (req: Request, res: Response) => userController.create(req, res));
router.put("/:id", adminOnly, (req: Request, res: Response) => userController.update(req, res));
router.delete("/:id", adminOnly, (req: Request, res: Response) => userController.delete(req, res));
router.patch("/:id/toggle-active", adminOnly, (req: Request, res: Response) => userController.toggleActive(req, res));

export default router;
