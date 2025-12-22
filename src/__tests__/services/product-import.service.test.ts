import * as XLSX from "xlsx";

// Mock all repository methods - must be declared before jest.mock
const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockCreate = jest.fn();
const mockSave = jest.fn();

// Mock AppDataSource - this gets hoisted, so we use inline mock factory
jest.mock("../../data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    })),
  },
}));

import { ProductImportService } from "../../services/product-import.service";
import { AppDataSource } from "../../data-source";

// Get mocked AppDataSource
const mockedAppDataSource = AppDataSource as jest.Mocked<typeof AppDataSource>;

// Helper to create Excel buffer from data
function createExcelBuffer(sheets: Record<string, any[]>): Buffer {
  const workbook = XLSX.utils.book_new();
  for (const [name, data] of Object.entries(sheets)) {
    const sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  }
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

describe("ProductImportService", () => {
  let service: ProductImportService;
  let mockRepo: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create fresh mock repo for each test
    mockRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => ({ ...data, id: "mock-id" })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id || "saved-id" })),
    };

    // Set up getRepository mock to return our mockRepo
    (mockedAppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepo);

    service = new ProductImportService();
  });

  describe("generateTemplate", () => {
    it("should generate a valid Excel template with all 4 sheets", () => {
      const buffer = service.generateTemplate();

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      // Parse and verify structure
      const workbook = XLSX.read(buffer, { type: "buffer" });
      expect(workbook.SheetNames).toContain("Products");
      expect(workbook.SheetNames).toContain("Variants");
      expect(workbook.SheetNames).toContain("Attributes");
      expect(workbook.SheetNames).toContain("Media");
    });

    it("should include sample data in Products sheet", () => {
      const buffer = service.generateTemplate();
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const products = XLSX.utils.sheet_to_json(workbook.Sheets["Products"]);

      expect(products.length).toBeGreaterThan(0);
      expect(products[0]).toHaveProperty("name");
      expect(products[0]).toHaveProperty("sku_prefix");
      expect(products[0]).toHaveProperty("base_price");
    });

    it("should include sample data in Variants sheet", () => {
      const buffer = service.generateTemplate();
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const variants = XLSX.utils.sheet_to_json(workbook.Sheets["Variants"]);

      expect(variants.length).toBeGreaterThan(0);
      expect(variants[0]).toHaveProperty("product_sku_prefix");
      expect(variants[0]).toHaveProperty("sku");
      expect(variants[0]).toHaveProperty("price");
    });

    it("should include sample data in Attributes sheet", () => {
      const buffer = service.generateTemplate();
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const attributes = XLSX.utils.sheet_to_json(workbook.Sheets["Attributes"]);

      expect(attributes.length).toBeGreaterThan(0);
      expect(attributes[0]).toHaveProperty("product_sku_prefix");
      expect(attributes[0]).toHaveProperty("attribute_name");
      expect(attributes[0]).toHaveProperty("value");
    });

    it("should include sample data in Media sheet", () => {
      const buffer = service.generateTemplate();
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const media = XLSX.utils.sheet_to_json(workbook.Sheets["Media"]);

      expect(media.length).toBeGreaterThan(0);
      expect(media[0]).toHaveProperty("product_sku_prefix");
      expect(media[0]).toHaveProperty("url");
      expect(media[0]).toHaveProperty("type");
    });
  });

  describe("importFromExcel", () => {
    describe("Sheet validation", () => {
      it("should return error when Products sheet is missing", async () => {
        const buffer = createExcelBuffer({
          WrongSheet: [{ name: "test" }],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.success).toBe(false);
        expect(result.errors).toContain("Sheet 'Products' không tồn tại");
      });

      it("should return error when Products sheet is empty", async () => {
        const buffer = createExcelBuffer({
          Products: [],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.success).toBe(false);
        expect(result.errors).toContain("Sheet 'Products' không có dữ liệu");
      });

      it("should handle missing optional sheets gracefully", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 100000 },
          ],
        });

        const result = await service.importFromExcel(buffer);

        // Should not fail due to missing optional sheets
        expect(result.errors.filter(e => e.includes("Variants") || e.includes("Attributes") || e.includes("Media"))).toHaveLength(0);
      });
    });

    describe("Product import", () => {
      it("should import a valid product successfully", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000 },
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.productsCreated).toBe(1);
        expect(mockRepo.save).toHaveBeenCalled();
      });

      it("should reject product without required fields", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product" }, // missing sku_prefix and base_price
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.productsCreated).toBe(0);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain("bắt buộc");
      });

      it("should reject product with missing name", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { sku_prefix: "TEST001", base_price: 1000000 }, // missing name
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.productsCreated).toBe(0);
        expect(result.errors[0]).toContain("bắt buộc");
      });

      it("should reject duplicate SKU prefix", async () => {
        mockRepo.findOne.mockResolvedValueOnce({ id: "existing-id", spk: "TEST001" });

        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000 },
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.productsCreated).toBe(0);
        expect(result.errors[0]).toContain("đã tồn tại");
      });

      it("should create brand if not exists and add warning", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000, brand_name: "New Brand" },
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.productsCreated).toBe(1);
        expect(result.warnings.some(w => w.includes("Tạo mới thương hiệu"))).toBe(true);
      });

      it("should use existing brand from cache", async () => {
        mockRepo.find.mockImplementation(() => [{ id: "brand-1", name: "Existing Brand" }]);

        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000, brand_name: "Existing Brand" },
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.productsCreated).toBe(1);
        expect(result.warnings.filter(w => w.includes("Tạo mới thương hiệu"))).toHaveLength(0);
      });

      it("should create category if not exists and add warning", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000, category_name: "New Category" },
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.productsCreated).toBe(1);
        expect(result.warnings.some(w => w.includes("Tạo mới danh mục"))).toBe(true);
      });

      it("should handle tags properly", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000, tags: "hot,new,sale" },
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.productsCreated).toBe(1);
        // Save should be called for product and then again for tags
        expect(mockRepo.save).toHaveBeenCalled();
      });

      it("should import multiple products", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Product 1", sku_prefix: "TEST001", base_price: 1000000 },
            { name: "Product 2", sku_prefix: "TEST002", base_price: 2000000 },
            { name: "Product 3", sku_prefix: "TEST003", base_price: 3000000 },
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.productsCreated).toBe(3);
      });

      it("should handle boolean is_featured field", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000, is_featured: true },
          ],
        });

        await service.importFromExcel(buffer);

        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({ isFeatured: true })
        );
      });

      it("should handle string 'true' for is_featured field", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000, is_featured: "true" },
          ],
        });

        await service.importFromExcel(buffer);

        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({ isFeatured: true })
        );
      });
    });

    describe("Variant import", () => {
      beforeEach(() => {
        // Mock product exists in cache
        mockRepo.save.mockImplementation((entity: any) => {
          if (entity.spk) {
            return Promise.resolve({ ...entity, id: "product-id" });
          }
          return Promise.resolve({ ...entity, id: entity.id || "saved-id" });
        });
      });

      it("should import variant for existing product", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000 },
          ],
          Variants: [
            { product_sku_prefix: "TEST001", sku: "TEST001-VAR1", price: 1100000 },
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.productsCreated).toBe(1);
        expect(result.variantsCreated).toBe(1);
      });

      it("should reject variant without required fields", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000 },
          ],
          Variants: [
            { product_sku_prefix: "TEST001" }, // missing sku and price
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.variantsCreated).toBe(0);
        expect(result.errors.some(e => e.includes("Variants") && e.includes("bắt buộc"))).toBe(true);
      });

      it("should reject variant for non-existent product", async () => {
        // Empty Products sheet will fail early, so use a valid product but variant references different prefix
        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000 },
          ],
          Variants: [
            { product_sku_prefix: "NONEXISTENT", sku: "VAR1", price: 1000000 },
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.variantsCreated).toBe(0);
        expect(result.errors.some(e => e.includes("Không tìm thấy sản phẩm"))).toBe(true);
      });

      it("should reject duplicate variant SKU", async () => {
        mockRepo.findOne.mockImplementation(({ where }: any) => {
          if (where?.sku === "DUPLICATE-SKU") {
            return Promise.resolve({ id: "existing-variant" });
          }
          return Promise.resolve(null);
        });

        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000 },
          ],
          Variants: [
            { product_sku_prefix: "TEST001", sku: "DUPLICATE-SKU", price: 1100000 },
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.errors.some(e => e.includes("đã tồn tại"))).toBe(true);
      });

      it("should handle variant options", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000 },
          ],
          Variants: [
            {
              product_sku_prefix: "TEST001",
              sku: "TEST001-VAR1",
              price: 1100000,
              option_1_type: "Size",
              option_1_value: "Large",
              option_2_type: "Color",
              option_2_value: "Red",
              option_2_color_code: "#FF0000",
            },
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.variantsCreated).toBe(1);
        // Should create option types and values
        expect(mockRepo.create).toHaveBeenCalled();
      });

      it("should handle variant image", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000 },
          ],
          Variants: [
            {
              product_sku_prefix: "TEST001",
              sku: "TEST001-VAR1",
              price: 1100000,
              image_url: "https://example.com/image.jpg",
            },
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.variantsCreated).toBe(1);
      });

      it("should import multiple variants", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000 },
          ],
          Variants: [
            { product_sku_prefix: "TEST001", sku: "TEST001-VAR1", price: 1100000 },
            { product_sku_prefix: "TEST001", sku: "TEST001-VAR2", price: 1200000 },
            { product_sku_prefix: "TEST001", sku: "TEST001-VAR3", price: 1300000 },
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.variantsCreated).toBe(3);
      });
    });

    describe("Attribute import", () => {
      beforeEach(() => {
        mockRepo.save.mockImplementation((entity: any) => {
          if (entity.spk) {
            return Promise.resolve({ ...entity, id: "product-id" });
          }
          return Promise.resolve({ ...entity, id: entity.id || "saved-id" });
        });
      });

      it("should import attribute for existing product", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000 },
          ],
          Attributes: [
            { product_sku_prefix: "TEST001", attribute_name: "Screen Size", value: "6.7 inch" },
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.productsCreated).toBe(1);
        // No errors related to attributes
        expect(result.warnings.filter(w => w.includes("Attributes"))).toHaveLength(0);
      });

      it("should add warning for attribute without required fields", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000 },
          ],
          Attributes: [
            { product_sku_prefix: "TEST001" }, // missing attribute_name and value
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.warnings.some(w => w.includes("Attributes"))).toBe(true);
      });

      it("should update existing attribute value", async () => {
        mockRepo.findOne.mockImplementation(({ where }: any) => {
          if (where?.productId && where?.attributeId) {
            return Promise.resolve({ id: "existing-attr", value: "old value" });
          }
          return Promise.resolve(null);
        });

        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000 },
          ],
          Attributes: [
            { product_sku_prefix: "TEST001", attribute_name: "Screen Size", value: "new value" },
          ],
        });

        await service.importFromExcel(buffer);

        // Should call save with updated value
        expect(mockRepo.save).toHaveBeenCalled();
      });
    });

    describe("Media import", () => {
      beforeEach(() => {
        mockRepo.save.mockImplementation((entity: any) => {
          if (entity.spk) {
            return Promise.resolve({ ...entity, id: "product-id" });
          }
          return Promise.resolve({ ...entity, id: entity.id || "saved-id" });
        });
      });

      it("should import media for existing product", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000 },
          ],
          Media: [
            { product_sku_prefix: "TEST001", type: "image", url: "https://example.com/img.jpg" },
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.productsCreated).toBe(1);
        expect(result.warnings.filter(w => w.includes("Media"))).toHaveLength(0);
      });

      it("should add warning for media without required fields", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000 },
          ],
          Media: [
            { product_sku_prefix: "TEST001" }, // missing type and url
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.warnings.some(w => w.includes("Media"))).toBe(true);
      });

      it("should handle is_primary flag", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Test Product", sku_prefix: "TEST001", base_price: 1000000 },
          ],
          Media: [
            { product_sku_prefix: "TEST001", type: "image", url: "https://example.com/img.jpg", is_primary: true },
          ],
        });

        await service.importFromExcel(buffer);

        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({ isPrimary: true })
        );
      });
    });

    describe("Error handling", () => {
      it("should handle invalid Excel buffer", async () => {
        const invalidBuffer = Buffer.from("not an excel file");

        const result = await service.importFromExcel(invalidBuffer);

        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it("should continue processing after individual row errors", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Valid Product", sku_prefix: "TEST001", base_price: 1000000 },
            { name: "Invalid Product" }, // missing required fields
            { name: "Another Valid", sku_prefix: "TEST002", base_price: 2000000 },
          ],
        });

        const result = await service.importFromExcel(buffer);

        // Should import 2 valid products and record 1 error
        expect(result.productsCreated).toBe(2);
        expect(result.errors.length).toBe(1);
      });

      it("should report correct row numbers in errors", async () => {
        const buffer = createExcelBuffer({
          Products: [
            { name: "Product 1", sku_prefix: "TEST001", base_price: 1000000 },
            { name: "Product 2", sku_prefix: "TEST002", base_price: 2000000 },
            { name: "Invalid" }, // Row 4 (1 header + 3 data rows)
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.errors.some(e => e.includes("Dòng 4"))).toBe(true);
      });
    });

    describe("Full import flow", () => {
      it("should import complete product with all related data", async () => {
        const buffer = createExcelBuffer({
          Products: [
            {
              name: "Complete Product",
              sku_prefix: "FULL001",
              base_price: 10000000,
              brand_name: "Test Brand",
              category_name: "Test Category",
              tags: "tag1,tag2",
            },
          ],
          Variants: [
            { product_sku_prefix: "FULL001", sku: "FULL001-V1", price: 10500000, option_1_type: "Size", option_1_value: "M" },
            { product_sku_prefix: "FULL001", sku: "FULL001-V2", price: 11000000, option_1_type: "Size", option_1_value: "L" },
          ],
          Attributes: [
            { product_sku_prefix: "FULL001", attribute_name: "Material", value: "Cotton" },
            { product_sku_prefix: "FULL001", attribute_name: "Weight", value: "200g" },
          ],
          Media: [
            { product_sku_prefix: "FULL001", type: "image", url: "https://example.com/1.jpg", is_primary: true },
            { product_sku_prefix: "FULL001", type: "image", url: "https://example.com/2.jpg" },
          ],
        });

        const result = await service.importFromExcel(buffer);

        expect(result.productsCreated).toBe(1);
        expect(result.variantsCreated).toBe(2);
        expect(result.success).toBe(true);
      });
    });
  });
});
