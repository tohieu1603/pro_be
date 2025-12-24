import ExcelJS from "exceljs";
import { AppDataSource } from "../data-source";
import {
  Product,
  ProductVariant,
  ProductAttribute,
  ProductMedia,
  Brand,
  Category,
  Tag,
  VariantOptionType,
  VariantOptionValue,
  ProductVariantOption,
  AttributeDefinition,
  ProductStatus,
} from "../entities";
import { AttributeDataType } from "../entities/attribute-definition.entity";
import { TagType } from "../entities/tag.entity";
import { VariantStatus } from "../entities/product-variant.entity";
import { MediaType } from "../entities/product-media.entity";
import { generateSlug as slugify } from "../utils/slug";

interface ProductRow {
  name: string;
  sku_prefix: string;
  slug?: string;
  brand_name?: string;
  category_name?: string;
  base_price: number;
  short_description?: string;
  description?: string;
  is_featured?: boolean;
  status?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string;
}

interface VariantRow {
  product_sku_prefix: string;
  sku: string;
  option_1_type?: string;
  option_1_value?: string;
  option_2_type?: string;
  option_2_value?: string;
  option_2_color_code?: string;
  option_3_type?: string;
  option_3_value?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  stock_quantity?: number;
  is_default?: boolean;
  image_url?: string;
}

interface AttributeRow {
  product_sku_prefix: string;
  attribute_name: string;
  value: string;
  display_group?: string;
  display_order?: number;
}

interface MediaRow {
  product_sku_prefix: string;
  type: string;
  url: string;
  alt_text?: string;
  display_order?: number;
  is_primary?: boolean;
}

interface ImportResult {
  success: boolean;
  productsCreated: number;
  variantsCreated: number;
  errors: string[];
  warnings: string[];
}

export class ProductImportService {
  private brandRepo = AppDataSource.getRepository(Brand);
  private categoryRepo = AppDataSource.getRepository(Category);
  private tagRepo = AppDataSource.getRepository(Tag);
  private productRepo = AppDataSource.getRepository(Product);
  private variantRepo = AppDataSource.getRepository(ProductVariant);
  private attributeDefRepo = AppDataSource.getRepository(AttributeDefinition);
  private productAttributeRepo = AppDataSource.getRepository(ProductAttribute);
  private mediaRepo = AppDataSource.getRepository(ProductMedia);
  private optionTypeRepo = AppDataSource.getRepository(VariantOptionType);
  private optionValueRepo = AppDataSource.getRepository(VariantOptionValue);
  private variantOptionRepo = AppDataSource.getRepository(ProductVariantOption);

  // Cache for lookups during import
  private brandCache: Map<string, Brand> = new Map();
  private categoryCache: Map<string, Category> = new Map();
  private tagCache: Map<string, Tag> = new Map();
  private optionTypeCache: Map<string, VariantOptionType> = new Map();
  private optionValueCache: Map<string, VariantOptionValue> = new Map();
  private attributeDefCache: Map<string, AttributeDefinition> = new Map();
  private productCache: Map<string, Product> = new Map();

  /**
   * Convert ExcelJS worksheet to array of objects
   */
  private worksheetToJson<T>(worksheet: ExcelJS.Worksheet): T[] {
    const rows: T[] = [];
    const headers: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        // Header row
        row.eachCell((cell) => {
          headers.push(String(cell.value || "").toLowerCase().replace(/\s+/g, "_"));
        });
      } else {
        // Data rows
        const rowData: Record<string, unknown> = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            rowData[header] = cell.value;
          }
        });
        if (Object.keys(rowData).length > 0) {
          rows.push(rowData as T);
        }
      }
    });

    return rows;
  }

  async importFromExcel(buffer: Buffer): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      productsCreated: 0,
      variantsCreated: 0,
      errors: [],
      warnings: [],
    };

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

      // Clear caches
      this.clearCaches();

      // Load existing data into caches
      await this.loadCaches();

      // Get sheets
      const productsSheet = workbook.getWorksheet("Products");
      const variantsSheet = workbook.getWorksheet("Variants");
      const attributesSheet = workbook.getWorksheet("Attributes");
      const mediaSheet = workbook.getWorksheet("Media");

      if (!productsSheet) {
        result.errors.push("Sheet 'Products' không tồn tại");
        return result;
      }

      // Parse products
      const products = this.worksheetToJson<ProductRow>(productsSheet);
      if (products.length === 0) {
        result.errors.push("Sheet 'Products' không có dữ liệu");
        return result;
      }

      // Parse variants (optional)
      const variants = variantsSheet
        ? this.worksheetToJson<VariantRow>(variantsSheet)
        : [];

      // Parse attributes (optional)
      const attributes = attributesSheet
        ? this.worksheetToJson<AttributeRow>(attributesSheet)
        : [];

      // Parse media (optional)
      const media = mediaSheet
        ? this.worksheetToJson<MediaRow>(mediaSheet)
        : [];

      // Import products
      for (let i = 0; i < products.length; i++) {
        const row = products[i];
        const rowNum = i + 2; // Excel row number (1-indexed + header)

        try {
          await this.importProduct(row, rowNum, result);
          result.productsCreated++;
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          result.errors.push(`Dòng ${rowNum}: ${message}`);
        }
      }

      // Import variants
      for (let i = 0; i < variants.length; i++) {
        const row = variants[i];
        const rowNum = i + 2;

        try {
          await this.importVariant(row, rowNum, result);
          result.variantsCreated++;
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          result.errors.push(`Variants dòng ${rowNum}: ${message}`);
        }
      }

      // Import attributes
      for (let i = 0; i < attributes.length; i++) {
        const row = attributes[i];
        const rowNum = i + 2;

        try {
          await this.importAttribute(row, rowNum, result);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          result.warnings.push(`Attributes dòng ${rowNum}: ${message}`);
        }
      }

      // Import media
      for (let i = 0; i < media.length; i++) {
        const row = media[i];
        const rowNum = i + 2;

        try {
          await this.importMedia(row, rowNum, result);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          result.warnings.push(`Media dòng ${rowNum}: ${message}`);
        }
      }

      result.success = result.errors.length === 0;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`Lỗi xử lý file: ${message}`);
    }

    return result;
  }

  private clearCaches() {
    this.brandCache.clear();
    this.categoryCache.clear();
    this.tagCache.clear();
    this.optionTypeCache.clear();
    this.optionValueCache.clear();
    this.attributeDefCache.clear();
    this.productCache.clear();
  }

  private async loadCaches() {
    // Load brands
    const brands = await this.brandRepo.find();
    brands.forEach(b => this.brandCache.set(b.name.toLowerCase(), b));

    // Load categories
    const categories = await this.categoryRepo.find();
    categories.forEach(c => this.categoryCache.set(c.name.toLowerCase(), c));

    // Load tags
    const tags = await this.tagRepo.find();
    tags.forEach(t => this.tagCache.set(t.name.toLowerCase(), t));

    // Load option types
    const optionTypes = await this.optionTypeRepo.find({ relations: ["values"] });
    optionTypes.forEach(ot => this.optionTypeCache.set(ot.name.toLowerCase(), ot));

    // Load attribute definitions
    const attrDefs = await this.attributeDefRepo.find();
    attrDefs.forEach(ad => this.attributeDefCache.set(ad.name.toLowerCase(), ad));
  }

  private parseProductStatus(status?: string): ProductStatus {
    if (!status) return ProductStatus.DRAFT;
    const lower = String(status).toLowerCase();
    if (lower === "active") return ProductStatus.ACTIVE;
    if (lower === "inactive") return ProductStatus.INACTIVE;
    if (lower === "discontinued") return ProductStatus.DISCONTINUED;
    return ProductStatus.DRAFT;
  }

  private parseVariantStatus(status?: string): VariantStatus {
    if (!status) return VariantStatus.ACTIVE;
    const lower = String(status).toLowerCase();
    if (lower === "inactive") return VariantStatus.INACTIVE;
    if (lower === "out_of_stock") return VariantStatus.OUT_OF_STOCK;
    return VariantStatus.ACTIVE;
  }

  private parseMediaType(type?: string): MediaType {
    if (!type) return MediaType.IMAGE;
    const lower = String(type).toLowerCase();
    if (lower === "video") return MediaType.VIDEO;
    if (lower === "360") return MediaType.VIEW_360;
    if (lower === "ar_model") return MediaType.AR_MODEL;
    return MediaType.IMAGE;
  }

  private async importProduct(row: ProductRow, rowNum: number, result: ImportResult): Promise<void> {
    if (!row.name || !row.sku_prefix || !row.base_price) {
      throw new Error("Thiếu trường bắt buộc: name, sku_prefix, hoặc base_price");
    }

    // Check if product already exists
    const existing = await this.productRepo.findOne({
      where: [
        { spk: String(row.sku_prefix) },
        { slug: row.slug || slugify(String(row.name)) }
      ]
    });
    if (existing) {
      throw new Error(`Sản phẩm với SKU prefix '${row.sku_prefix}' đã tồn tại`);
    }

    // Get or create brand
    let brand: Brand | null = null;
    if (row.brand_name) {
      brand = this.brandCache.get(String(row.brand_name).toLowerCase()) || null;
      if (!brand) {
        brand = this.brandRepo.create({
          name: String(row.brand_name),
          slug: slugify(String(row.brand_name)),
          isActive: true,
        });
        brand = await this.brandRepo.save(brand);
        this.brandCache.set(String(row.brand_name).toLowerCase(), brand);
        result.warnings.push(`Dòng ${rowNum}: Tạo mới thương hiệu '${row.brand_name}'`);
      }
    }

    // Get or create category
    let category: Category | null = null;
    if (row.category_name) {
      category = this.categoryCache.get(String(row.category_name).toLowerCase()) || null;
      if (!category) {
        category = this.categoryRepo.create({
          name: String(row.category_name),
          slug: slugify(String(row.category_name)),
          level: 1,
          displayOrder: 0,
          isActive: true,
        });
        category = await this.categoryRepo.save(category);
        this.categoryCache.set(String(row.category_name).toLowerCase(), category);
        result.warnings.push(`Dòng ${rowNum}: Tạo mới danh mục '${row.category_name}'`);
      }
    }

    // Create product
    const isFeatured = row.is_featured === true || String(row.is_featured).toLowerCase() === "true";
    const product = this.productRepo.create({
      name: String(row.name),
      spk: String(row.sku_prefix),
      slug: row.slug ? String(row.slug) : slugify(String(row.name)),
      brandId: brand?.id,
      categoryId: category?.id,
      basePrice: Number(row.base_price),
      shortDescription: row.short_description ? String(row.short_description) : undefined,
      description: row.description ? String(row.description) : undefined,
      isFeatured,
      status: this.parseProductStatus(row.status),
      metaTitle: row.meta_title ? String(row.meta_title) : undefined,
      metaDescription: row.meta_description ? String(row.meta_description) : undefined,
    });

    const savedProduct = await this.productRepo.save(product);
    this.productCache.set(String(row.sku_prefix).toLowerCase(), savedProduct);

    // Handle tags
    if (row.tags) {
      const tagNames = String(row.tags).split(",").map(t => t.trim()).filter(t => t);
      const productTags: Tag[] = [];

      for (const tagName of tagNames) {
        let tag = this.tagCache.get(tagName.toLowerCase());
        if (!tag) {
          tag = this.tagRepo.create({
            name: tagName,
            slug: slugify(tagName),
            type: TagType.GENERAL,
          });
          tag = await this.tagRepo.save(tag);
          this.tagCache.set(tagName.toLowerCase(), tag);
        }
        productTags.push(tag);
      }

      savedProduct.tags = productTags;
      await this.productRepo.save(savedProduct);
    }
  }

  private async importVariant(row: VariantRow, rowNum: number, result: ImportResult): Promise<void> {
    if (!row.product_sku_prefix || !row.sku || !row.price) {
      throw new Error("Thiếu trường bắt buộc: product_sku_prefix, sku, hoặc price");
    }

    // Find product
    let product = this.productCache.get(String(row.product_sku_prefix).toLowerCase());
    if (!product) {
      product = await this.productRepo.findOne({ where: { spk: String(row.product_sku_prefix) } }) || undefined;
      if (product) {
        this.productCache.set(String(row.product_sku_prefix).toLowerCase(), product);
      }
    }

    if (!product) {
      throw new Error(`Không tìm thấy sản phẩm với SKU prefix '${row.product_sku_prefix}'`);
    }

    // Check if variant exists
    const existingVariant = await this.variantRepo.findOne({ where: { sku: String(row.sku) } });
    if (existingVariant) {
      throw new Error(`Variant với SKU '${row.sku}' đã tồn tại`);
    }

    // Create variant
    const isDefault = row.is_default === true || String(row.is_default).toLowerCase() === "true";
    const variant = this.variantRepo.create({
      productId: product.id,
      sku: String(row.sku),
      price: Number(row.price),
      compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
      costPrice: row.cost_price ? Number(row.cost_price) : undefined,
      stockQuantity: row.stock_quantity ? Number(row.stock_quantity) : 0,
      isDefault,
      status: this.parseVariantStatus(),
    });

    const savedVariant = await this.variantRepo.save(variant);

    // Handle variant options
    const optionPairs = [
      { type: row.option_1_type, value: row.option_1_value, colorCode: undefined },
      { type: row.option_2_type, value: row.option_2_value, colorCode: row.option_2_color_code },
      { type: row.option_3_type, value: row.option_3_value, colorCode: undefined },
    ].filter(o => o.type && o.value);

    for (const opt of optionPairs) {
      if (!opt.type || !opt.value) continue;

      // Get or create option type
      let optionType = this.optionTypeCache.get(String(opt.type).toLowerCase());
      if (!optionType) {
        optionType = this.optionTypeRepo.create({
          name: String(opt.type),
          slug: slugify(String(opt.type)),
          displayOrder: 0,
        });
        optionType = await this.optionTypeRepo.save(optionType);
        this.optionTypeCache.set(String(opt.type).toLowerCase(), optionType);
      }

      // Get or create option value
      const valueKey = `${optionType.id}-${String(opt.value).toLowerCase()}`;
      let optionValue = this.optionValueCache.get(valueKey);
      if (!optionValue) {
        const foundValue = await this.optionValueRepo.findOne({
          where: { optionTypeId: optionType.id, value: String(opt.value) }
        });
        if (foundValue) {
          optionValue = foundValue;
        } else {
          optionValue = this.optionValueRepo.create({
            optionTypeId: optionType.id,
            value: String(opt.value),
            displayValue: String(opt.value),
            colorCode: opt.colorCode ? String(opt.colorCode) : undefined,
            displayOrder: 0,
          });
          optionValue = await this.optionValueRepo.save(optionValue);
        }
        this.optionValueCache.set(valueKey, optionValue);
      }

      // Create variant option link
      const variantOption = this.variantOptionRepo.create({
        variantId: savedVariant.id,
        optionTypeId: optionType.id,
        optionValueId: optionValue.id,
      });
      await this.variantOptionRepo.save(variantOption);
    }

    // Handle image
    if (row.image_url) {
      const media = this.mediaRepo.create({
        productId: product.id,
        variantId: savedVariant.id,
        type: MediaType.IMAGE,
        url: String(row.image_url),
        displayOrder: 0,
        isPrimary: isDefault,
      });
      await this.mediaRepo.save(media);
    }
  }

  private async importAttribute(row: AttributeRow, _rowNum: number, _result: ImportResult): Promise<void> {
    if (!row.product_sku_prefix || !row.attribute_name || !row.value) {
      throw new Error("Thiếu trường bắt buộc");
    }

    // Find product
    let product = this.productCache.get(String(row.product_sku_prefix).toLowerCase());
    if (!product) {
      product = await this.productRepo.findOne({ where: { spk: String(row.product_sku_prefix) } }) || undefined;
      if (product) {
        this.productCache.set(String(row.product_sku_prefix).toLowerCase(), product);
      }
    }

    if (!product) {
      throw new Error(`Không tìm thấy sản phẩm với SKU prefix '${row.product_sku_prefix}'`);
    }

    // Get or create attribute definition
    let attrDef = this.attributeDefCache.get(String(row.attribute_name).toLowerCase());
    if (!attrDef) {
      attrDef = this.attributeDefRepo.create({
        name: String(row.attribute_name),
        slug: slugify(String(row.attribute_name)),
        dataType: AttributeDataType.TEXT,
        displayGroup: row.display_group ? String(row.display_group) : "Thông tin chung",
        displayOrder: row.display_order ? Number(row.display_order) : 0,
        isFilterable: false,
        isComparable: true,
      });
      attrDef = await this.attributeDefRepo.save(attrDef);
      this.attributeDefCache.set(String(row.attribute_name).toLowerCase(), attrDef);
    }

    // Check if attribute already exists for this product
    const existing = await this.productAttributeRepo.findOne({
      where: { productId: product.id, attributeId: attrDef.id }
    });
    if (existing) {
      existing.value = String(row.value);
      await this.productAttributeRepo.save(existing);
    } else {
      const productAttr = this.productAttributeRepo.create({
        productId: product.id,
        attributeId: attrDef.id,
        value: String(row.value),
      });
      await this.productAttributeRepo.save(productAttr);
    }
  }

  private async importMedia(row: MediaRow, _rowNum: number, _result: ImportResult): Promise<void> {
    if (!row.product_sku_prefix || !row.url || !row.type) {
      throw new Error("Thiếu trường bắt buộc");
    }

    // Find product
    let product = this.productCache.get(String(row.product_sku_prefix).toLowerCase());
    if (!product) {
      product = await this.productRepo.findOne({ where: { spk: String(row.product_sku_prefix) } }) || undefined;
      if (product) {
        this.productCache.set(String(row.product_sku_prefix).toLowerCase(), product);
      }
    }

    if (!product) {
      throw new Error(`Không tìm thấy sản phẩm với SKU prefix '${row.product_sku_prefix}'`);
    }

    const isPrimary = row.is_primary === true || String(row.is_primary).toLowerCase() === "true";
    const media = this.mediaRepo.create({
      productId: product.id,
      type: this.parseMediaType(row.type),
      url: String(row.url),
      altText: row.alt_text ? String(row.alt_text) : undefined,
      displayOrder: row.display_order ? Number(row.display_order) : 0,
      isPrimary,
    });
    await this.mediaRepo.save(media);
  }

  // Generate sample Excel template
  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    // Products sheet
    const productsSheet = workbook.addWorksheet("Products");
    productsSheet.columns = [
      { header: "name", key: "name", width: 30 },
      { header: "sku_prefix", key: "sku_prefix", width: 15 },
      { header: "slug", key: "slug", width: 30 },
      { header: "brand_name", key: "brand_name", width: 15 },
      { header: "category_name", key: "category_name", width: 15 },
      { header: "base_price", key: "base_price", width: 12 },
      { header: "short_description", key: "short_description", width: 40 },
      { header: "description", key: "description", width: 50 },
      { header: "is_featured", key: "is_featured", width: 10 },
      { header: "status", key: "status", width: 10 },
      { header: "meta_title", key: "meta_title", width: 30 },
      { header: "meta_description", key: "meta_description", width: 40 },
      { header: "tags", key: "tags", width: 20 },
    ];
    productsSheet.addRow({
      name: "iPhone 15 Pro Max",
      sku_prefix: "APL-IP-001",
      slug: "iphone-15-pro-max",
      brand_name: "Apple",
      category_name: "Điện thoại",
      base_price: 34990000,
      short_description: "Điện thoại cao cấp từ Apple",
      description: "Mô tả chi tiết sản phẩm...",
      is_featured: true,
      status: "active",
      meta_title: "iPhone 15 Pro Max | Chính hãng",
      meta_description: "Mua iPhone 15 Pro Max chính hãng",
      tags: "flagship,hot,new",
    });

    // Variants sheet
    const variantsSheet = workbook.addWorksheet("Variants");
    variantsSheet.columns = [
      { header: "product_sku_prefix", key: "product_sku_prefix", width: 15 },
      { header: "sku", key: "sku", width: 25 },
      { header: "option_1_type", key: "option_1_type", width: 12 },
      { header: "option_1_value", key: "option_1_value", width: 12 },
      { header: "option_2_type", key: "option_2_type", width: 12 },
      { header: "option_2_value", key: "option_2_value", width: 15 },
      { header: "option_2_color_code", key: "option_2_color_code", width: 15 },
      { header: "option_3_type", key: "option_3_type", width: 12 },
      { header: "option_3_value", key: "option_3_value", width: 12 },
      { header: "price", key: "price", width: 12 },
      { header: "compare_at_price", key: "compare_at_price", width: 15 },
      { header: "cost_price", key: "cost_price", width: 12 },
      { header: "stock_quantity", key: "stock_quantity", width: 12 },
      { header: "is_default", key: "is_default", width: 10 },
      { header: "image_url", key: "image_url", width: 40 },
    ];
    variantsSheet.addRow({
      product_sku_prefix: "APL-IP-001",
      sku: "APL-IP-001-256-TI-NAT",
      option_1_type: "Bộ nhớ",
      option_1_value: "256GB",
      option_2_type: "Màu sắc",
      option_2_value: "Titan Tự Nhiên",
      option_2_color_code: "#8B7355",
      price: 34990000,
      compare_at_price: 36990000,
      cost_price: 30000000,
      stock_quantity: 50,
      is_default: true,
      image_url: "https://example.com/iphone-256-natural.jpg",
    });
    variantsSheet.addRow({
      product_sku_prefix: "APL-IP-001",
      sku: "APL-IP-001-512-TI-NAT",
      option_1_type: "Bộ nhớ",
      option_1_value: "512GB",
      option_2_type: "Màu sắc",
      option_2_value: "Titan Tự Nhiên",
      option_2_color_code: "#8B7355",
      price: 40990000,
      compare_at_price: 42990000,
      cost_price: 36000000,
      stock_quantity: 30,
      is_default: false,
    });

    // Attributes sheet
    const attributesSheet = workbook.addWorksheet("Attributes");
    attributesSheet.columns = [
      { header: "product_sku_prefix", key: "product_sku_prefix", width: 15 },
      { header: "attribute_name", key: "attribute_name", width: 25 },
      { header: "value", key: "value", width: 30 },
      { header: "display_group", key: "display_group", width: 15 },
      { header: "display_order", key: "display_order", width: 12 },
    ];
    attributesSheet.addRow({ product_sku_prefix: "APL-IP-001", attribute_name: "Kích thước màn hình", value: "6.7 inch", display_group: "Màn hình", display_order: 1 });
    attributesSheet.addRow({ product_sku_prefix: "APL-IP-001", attribute_name: "Công nghệ màn hình", value: "Super Retina XDR OLED", display_group: "Màn hình", display_order: 2 });
    attributesSheet.addRow({ product_sku_prefix: "APL-IP-001", attribute_name: "Chip", value: "A17 Pro", display_group: "Cấu hình", display_order: 1 });
    attributesSheet.addRow({ product_sku_prefix: "APL-IP-001", attribute_name: "RAM", value: "8GB", display_group: "Cấu hình", display_order: 2 });

    // Media sheet
    const mediaSheet = workbook.addWorksheet("Media");
    mediaSheet.columns = [
      { header: "product_sku_prefix", key: "product_sku_prefix", width: 15 },
      { header: "type", key: "type", width: 10 },
      { header: "url", key: "url", width: 50 },
      { header: "alt_text", key: "alt_text", width: 30 },
      { header: "display_order", key: "display_order", width: 12 },
      { header: "is_primary", key: "is_primary", width: 10 },
    ];
    mediaSheet.addRow({ product_sku_prefix: "APL-IP-001", type: "image", url: "https://example.com/img1.jpg", alt_text: "iPhone 15 Pro Max", display_order: 1, is_primary: true });
    mediaSheet.addRow({ product_sku_prefix: "APL-IP-001", type: "image", url: "https://example.com/img2.jpg", alt_text: "iPhone 15 Pro Max - Back", display_order: 2, is_primary: false });

    // Write to buffer
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}

export const productImportService = new ProductImportService();
