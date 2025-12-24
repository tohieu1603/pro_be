import { Router } from "express";
import multer from "multer";
import { uploadController } from "../controllers/upload.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10, // Max 10 files at once
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."));
    }
  },
});

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/upload/image
 * Upload single image
 * Query params: folder (optional) - subfolder name (images, products, brands, etc.)
 */
router.post("/image", upload.single("file"), (req, res) =>
  uploadController.uploadSingle(req, res)
);

/**
 * POST /api/upload/images
 * Upload multiple images
 * Query params: folder (optional) - subfolder name
 */
router.post("/images", upload.array("files", 10), (req, res) =>
  uploadController.uploadMultiple(req, res)
);

/**
 * DELETE /api/upload/image
 * Delete image by URL
 * Body: { url: string }
 */
router.delete("/image", (req, res) => uploadController.deleteImage(req, res));

export default router;
