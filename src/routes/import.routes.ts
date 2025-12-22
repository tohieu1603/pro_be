import { Router } from "express";
import multer from "multer";
import { importController } from "../controllers/import.controller";

const router = Router();

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept Excel files only
    if (
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.endsWith(".xlsx") ||
      file.originalname.endsWith(".xls")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file Excel (.xlsx, .xls)"));
    }
  },
});

// POST /api/import/products - Import products from Excel
router.post("/products", upload.single("file"), (req, res) =>
  importController.importProducts(req, res)
);

// GET /api/import/template - Download Excel template
router.get("/template", (req, res) =>
  importController.downloadTemplate(req, res)
);

export default router;
