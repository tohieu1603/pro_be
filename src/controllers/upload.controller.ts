import { Request, Response } from "express";
import { uploadService } from "../services/upload.service";

class UploadController {
  // Upload single image
  async uploadSingle(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: "No file uploaded" });
        return;
      }

      const subfolder = (req.query.folder as string) || "images";
      const result = await uploadService.saveFile(req.file, subfolder);

      if (!result.success) {
        res.status(400).json({ success: false, message: result.error });
        return;
      }

      res.json({
        success: true,
        data: {
          url: result.url,
          filename: result.filename,
          originalName: result.originalName,
          size: result.size,
          mimeType: result.mimeType,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Upload failed",
      });
    }
  }

  // Upload multiple images
  async uploadMultiple(req: Request, res: Response): Promise<void> {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({ success: false, message: "No files uploaded" });
        return;
      }

      const subfolder = (req.query.folder as string) || "images";
      const results = await uploadService.saveFiles(req.files, subfolder);

      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      res.json({
        success: true,
        data: {
          uploaded: successful.map((r) => ({
            url: r.url,
            filename: r.filename,
            originalName: r.originalName,
            size: r.size,
            mimeType: r.mimeType,
          })),
          failed: failed.map((r) => ({
            error: r.error,
          })),
          total: results.length,
          successCount: successful.length,
          failedCount: failed.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Upload failed",
      });
    }
  }

  // Delete image
  async deleteImage(req: Request, res: Response): Promise<void> {
    try {
      const { url } = req.body;

      if (!url) {
        res.status(400).json({ success: false, message: "URL is required" });
        return;
      }

      const deleted = await uploadService.deleteFile(url);

      if (deleted) {
        res.json({ success: true, message: "File deleted successfully" });
      } else {
        res.status(404).json({ success: false, message: "File not found" });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Delete failed",
      });
    }
  }
}

export const uploadController = new UploadController();
