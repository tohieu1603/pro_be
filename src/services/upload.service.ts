import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Upload directory configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const UPLOAD_PATH = path.join(process.cwd(), UPLOAD_DIR);

// Allowed file types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
  error?: string;
}

class UploadService {
  constructor() {
    this.ensureUploadDir();
  }

  // Ensure upload directory exists
  private ensureUploadDir(): void {
    const dirs = ["", "images", "products", "brands", "categories", "articles"];
    dirs.forEach((dir) => {
      const fullPath = path.join(UPLOAD_PATH, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  // Validate file
  validateFile(file: Express.Multer.File): string | null {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    return null;
  }

  // Generate unique filename
  generateFilename(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const uuid = uuidv4().split("-")[0];
    return `${timestamp}-${uuid}${ext}`;
  }

  // Save uploaded file
  async saveFile(
    file: Express.Multer.File,
    subfolder: string = "images"
  ): Promise<UploadResult> {
    const validationError = this.validateFile(file);
    if (validationError) {
      return { success: false, error: validationError };
    }

    try {
      const filename = this.generateFilename(file.originalname);
      const relativePath = path.join(subfolder, filename);
      const fullPath = path.join(UPLOAD_PATH, relativePath);

      // Ensure subfolder exists
      const subfolderPath = path.join(UPLOAD_PATH, subfolder);
      if (!fs.existsSync(subfolderPath)) {
        fs.mkdirSync(subfolderPath, { recursive: true });
      }

      // Write file
      fs.writeFileSync(fullPath, file.buffer);

      // Return URL path (relative to uploads)
      const url = `/${UPLOAD_DIR}/${relativePath.replace(/\\/g, "/")}`;

      return {
        success: true,
        url,
        filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  // Save multiple files
  async saveFiles(
    files: Express.Multer.File[],
    subfolder: string = "images"
  ): Promise<UploadResult[]> {
    return Promise.all(files.map((file) => this.saveFile(file, subfolder)));
  }

  // Delete file
  async deleteFile(url: string): Promise<boolean> {
    try {
      // Convert URL to file path
      const relativePath = url.replace(`/${UPLOAD_DIR}/`, "");
      const fullPath = path.join(UPLOAD_PATH, relativePath);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Get upload directory path
  getUploadPath(): string {
    return UPLOAD_PATH;
  }

  // Get upload directory name
  getUploadDir(): string {
    return UPLOAD_DIR;
  }
}

export const uploadService = new UploadService();
