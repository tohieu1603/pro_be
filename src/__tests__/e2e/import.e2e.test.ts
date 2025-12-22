import request from "supertest";
import express, { Express } from "express";
import * as XLSX from "xlsx";
import multer from "multer";
import { ImportController } from "../../controllers/import.controller";
import { productImportService } from "../../services/product-import.service";

// Mock the import service
jest.mock("../../services/product-import.service", () => ({
  productImportService: {
    importFromExcel: jest.fn(),
    generateTemplate: jest.fn(),
  },
}));

const mockedImportService = productImportService as jest.Mocked<typeof productImportService>;

// Helper to create Excel buffer
function createExcelBuffer(sheets: Record<string, any[]>): Buffer {
  const workbook = XLSX.utils.book_new();
  for (const [name, data] of Object.entries(sheets)) {
    const sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  }
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

describe("Import API E2E Tests", () => {
  let app: Express;
  let importController: ImportController;

  beforeAll(() => {
    // Setup Express app for testing
    app = express();
    app.use(express.json());

    importController = new ImportController();

    // Configure multer
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
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

    // Setup routes
    app.post("/api/import/products", upload.single("file"), (req, res) =>
      importController.importProducts(req, res)
    );
    app.get("/api/import/template", (req, res) =>
      importController.downloadTemplate(req, res)
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/import/products", () => {
    describe("File validation", () => {
      it("should return 400 when no file is uploaded", async () => {
        const response = await request(app)
          .post("/api/import/products")
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("upload file");
      });

      it("should reject non-Excel files", async () => {
        const response = await request(app)
          .post("/api/import/products")
          .attach("file", Buffer.from("not excel"), {
            filename: "test.txt",
            contentType: "text/plain",
          });

        // Multer rejects this file, may return 400 or 500 depending on error handling
        expect([400, 500]).toContain(response.status);
      });

      it("should accept .xlsx files", async () => {
        const excelBuffer = createExcelBuffer({
          Products: [{ name: "Test", sku_prefix: "T1", base_price: 100 }],
        });

        mockedImportService.importFromExcel.mockResolvedValue({
          success: true,
          productsCreated: 1,
          variantsCreated: 0,
          errors: [],
          warnings: [],
        });

        const response = await request(app)
          .post("/api/import/products")
          .attach("file", excelBuffer, {
            filename: "products.xlsx",
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it("should accept .xls files", async () => {
        const excelBuffer = createExcelBuffer({
          Products: [{ name: "Test", sku_prefix: "T1", base_price: 100 }],
        });

        mockedImportService.importFromExcel.mockResolvedValue({
          success: true,
          productsCreated: 1,
          variantsCreated: 0,
          errors: [],
          warnings: [],
        });

        const response = await request(app)
          .post("/api/import/products")
          .attach("file", excelBuffer, {
            filename: "products.xls",
            contentType: "application/vnd.ms-excel",
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe("Successful import", () => {
      it("should return success response with import statistics", async () => {
        const excelBuffer = createExcelBuffer({
          Products: [
            { name: "Product 1", sku_prefix: "P1", base_price: 100000 },
            { name: "Product 2", sku_prefix: "P2", base_price: 200000 },
          ],
          Variants: [
            { product_sku_prefix: "P1", sku: "P1-V1", price: 110000 },
          ],
        });

        mockedImportService.importFromExcel.mockResolvedValue({
          success: true,
          productsCreated: 2,
          variantsCreated: 1,
          errors: [],
          warnings: ["Tạo mới brand 'Test Brand'"],
        });

        const response = await request(app)
          .post("/api/import/products")
          .attach("file", excelBuffer, {
            filename: "products.xlsx",
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain("2 sản phẩm");
        expect(response.body.message).toContain("1 biến thể");
        expect(response.body.data.productsCreated).toBe(2);
        expect(response.body.data.variantsCreated).toBe(1);
        expect(response.body.data.errors).toHaveLength(0);
        expect(response.body.data.warnings).toHaveLength(1);
      });

      it("should call importFromExcel with file buffer", async () => {
        const excelBuffer = createExcelBuffer({
          Products: [{ name: "Test", sku_prefix: "T1", base_price: 100 }],
        });

        mockedImportService.importFromExcel.mockResolvedValue({
          success: true,
          productsCreated: 1,
          variantsCreated: 0,
          errors: [],
          warnings: [],
        });

        await request(app)
          .post("/api/import/products")
          .attach("file", excelBuffer, {
            filename: "products.xlsx",
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });

        expect(mockedImportService.importFromExcel).toHaveBeenCalledTimes(1);
        expect(mockedImportService.importFromExcel).toHaveBeenCalledWith(expect.any(Buffer));
      });
    });

    describe("Import with errors", () => {
      it("should return errors in response when import has errors", async () => {
        const excelBuffer = createExcelBuffer({
          Products: [{ name: "Test" }], // missing required fields
        });

        mockedImportService.importFromExcel.mockResolvedValue({
          success: false,
          productsCreated: 0,
          variantsCreated: 0,
          errors: ["Dòng 2: Thiếu trường bắt buộc"],
          warnings: [],
        });

        const response = await request(app)
          .post("/api/import/products")
          .attach("file", excelBuffer, {
            filename: "products.xlsx",
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          })
          .expect(200);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("có lỗi");
        expect(response.body.data.errors).toHaveLength(1);
        expect(response.body.data.errors[0]).toContain("Dòng 2");
      });

      it("should return partial success when some rows fail", async () => {
        const excelBuffer = createExcelBuffer({
          Products: [
            { name: "Valid", sku_prefix: "V1", base_price: 100 },
            { name: "Invalid" }, // missing fields
          ],
        });

        mockedImportService.importFromExcel.mockResolvedValue({
          success: false,
          productsCreated: 1,
          variantsCreated: 0,
          errors: ["Dòng 3: Thiếu trường bắt buộc"],
          warnings: [],
        });

        const response = await request(app)
          .post("/api/import/products")
          .attach("file", excelBuffer, {
            filename: "products.xlsx",
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          })
          .expect(200);

        expect(response.body.success).toBe(false);
        expect(response.body.data.productsCreated).toBe(1);
        expect(response.body.data.errors.length).toBeGreaterThan(0);
      });
    });

    describe("Error handling", () => {
      it("should return 500 when service throws error", async () => {
        const excelBuffer = createExcelBuffer({
          Products: [{ name: "Test", sku_prefix: "T1", base_price: 100 }],
        });

        mockedImportService.importFromExcel.mockRejectedValue(
          new Error("Database connection failed")
        );

        const response = await request(app)
          .post("/api/import/products")
          .attach("file", excelBuffer, {
            filename: "products.xlsx",
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          })
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("Lỗi server");
      });
    });
  });

  describe("GET /api/import/template", () => {
    it("should return Excel file with correct content type", async () => {
      const templateBuffer = createExcelBuffer({
        Products: [{ name: "Sample", sku_prefix: "S1", base_price: 100 }],
        Variants: [],
        Attributes: [],
        Media: [],
      });

      mockedImportService.generateTemplate.mockReturnValue(templateBuffer);

      const response = await request(app)
        .get("/api/import/template")
        .expect(200);

      expect(response.headers["content-type"]).toContain(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    });

    it("should set correct Content-Disposition header", async () => {
      const templateBuffer = createExcelBuffer({
        Products: [{ name: "Sample", sku_prefix: "S1", base_price: 100 }],
      });

      mockedImportService.generateTemplate.mockReturnValue(templateBuffer);

      const response = await request(app)
        .get("/api/import/template")
        .expect(200);

      expect(response.headers["content-disposition"]).toContain("attachment");
      expect(response.headers["content-disposition"]).toContain("product-import-template.xlsx");
    });

    it("should return valid Excel buffer", async () => {
      const templateBuffer = createExcelBuffer({
        Products: [{ name: "Sample", sku_prefix: "S1", base_price: 100 }],
        Variants: [],
        Attributes: [],
        Media: [],
      });

      mockedImportService.generateTemplate.mockReturnValue(templateBuffer);

      const response = await request(app)
        .get("/api/import/template")
        .responseType("arraybuffer")
        .expect(200);

      // Verify response is a valid Excel file
      const workbook = XLSX.read(Buffer.from(response.body), { type: "buffer" });
      expect(workbook.SheetNames.length).toBeGreaterThan(0);
    });

    it("should return 500 when template generation fails", async () => {
      mockedImportService.generateTemplate.mockImplementation(() => {
        throw new Error("Template generation failed");
      });

      const response = await request(app)
        .get("/api/import/template")
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Lỗi tạo template");
    });
  });
});

describe("Import Controller Unit Tests", () => {
  let controller: ImportController;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ImportController();

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe("importProducts", () => {
    it("should return 400 when no file in request", async () => {
      mockReq = { file: undefined };

      await controller.importProducts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("upload file"),
        })
      );
    });

    it("should call service with file buffer", async () => {
      const buffer = Buffer.from("test");
      mockReq = { file: { buffer } };

      mockedImportService.importFromExcel.mockResolvedValue({
        success: true,
        productsCreated: 1,
        variantsCreated: 0,
        errors: [],
        warnings: [],
      });

      await controller.importProducts(mockReq, mockRes);

      expect(mockedImportService.importFromExcel).toHaveBeenCalledWith(buffer);
    });

    it("should return formatted response on success", async () => {
      mockReq = { file: { buffer: Buffer.from("test") } };

      mockedImportService.importFromExcel.mockResolvedValue({
        success: true,
        productsCreated: 5,
        variantsCreated: 10,
        errors: [],
        warnings: ["warning1"],
      });

      await controller.importProducts(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: expect.stringContaining("5 sản phẩm"),
        data: {
          productsCreated: 5,
          variantsCreated: 10,
          errors: [],
          warnings: ["warning1"],
        },
      });
    });

    it("should return error message when import fails", async () => {
      mockReq = { file: { buffer: Buffer.from("test") } };

      mockedImportService.importFromExcel.mockResolvedValue({
        success: false,
        productsCreated: 0,
        variantsCreated: 0,
        errors: ["error1"],
        warnings: [],
      });

      await controller.importProducts(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("có lỗi"),
        })
      );
    });

    it("should handle service exceptions", async () => {
      mockReq = { file: { buffer: Buffer.from("test") } };

      mockedImportService.importFromExcel.mockRejectedValue(new Error("DB error"));

      await controller.importProducts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "DB error",
        })
      );
    });
  });

  describe("downloadTemplate", () => {
    it("should set correct headers", async () => {
      mockReq = {};
      mockedImportService.generateTemplate.mockReturnValue(Buffer.from("excel"));

      await controller.downloadTemplate(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Content-Disposition",
        "attachment; filename=product-import-template.xlsx"
      );
    });

    it("should send buffer from service", async () => {
      mockReq = {};
      const buffer = Buffer.from("excel content");
      mockedImportService.generateTemplate.mockReturnValue(buffer);

      await controller.downloadTemplate(mockReq, mockRes);

      expect(mockRes.send).toHaveBeenCalledWith(buffer);
    });

    it("should handle service exceptions", async () => {
      mockReq = {};
      mockedImportService.generateTemplate.mockImplementation(() => {
        throw new Error("Generation failed");
      });

      await controller.downloadTemplate(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Lỗi tạo template"),
        })
      );
    });
  });
});
