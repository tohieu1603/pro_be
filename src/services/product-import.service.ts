import * as XLSX from "xlsx";
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
} from "../entities";
import { AttributeDataType } from "../entities/attribute-definition.entity";
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

  async importFromExcel(buffer: Buffer): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      productsCreated: 0,
      variantsCreated: 0,
      errors: [],
      warnings: [],
    };

    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });

      // Clear caches
      this.clearCaches();

      // Load existing data into caches
      await this.loadCaches();

      // Process sheets
      const productsSheet = workbook.Sheets["Products"];
      const variantsSheet = workbook.Sheets["Variants"];
      const attributesSheet = workbook.Sheets["Attributes"];
      const mediaSheet = workbook.Sheets["Media"];

      if (!productsSheet) {
        result.errors.push("Sheet 'Products' không tồn tại");
        return result;
      }

      // Parse products
      const products: ProductRow[] = XLSX.utils.sheet_to_json(productsSheet);
      if (products.length === 0) {
        result.errors.push("Sheet 'Products' không có dữ liệu");
        return result;
      }

      // Parse variants (optional)
      const variants: VariantRow[] = variantsSheet
        ? XLSX.utils.sheet_to_json(variantsSheet)
        : [];

      // Parse attributes (optional)
      const attributes: AttributeRow[] = attributesSheet
        ? XLSX.utils.sheet_to_json(attributesSheet)
        : [];

      // Parse media (optional)
      const media: MediaRow[] = mediaSheet
        ? XLSX.utils.sheet_to_json(mediaSheet)
        : [];

      // Import products
      for (let i = 0; i < products.length; i++) {
        const row = products[i];
        const rowNum = i + 2; // Excel row number (1-indexed + header)

        try {
          await this.importProduct(row, rowNum, result);
          result.productsCreated++;
        } catch (error: any) {
          result.errors.push(`Dòng ${rowNum}: ${error.message}`);
        }
      }

      // Import variants
      for (let i = 0; i < variants.length; i++) {
        const row = variants[i];
        const rowNum = i + 2;

        try {
          await this.importVariant(row, rowNum, result);
          result.variantsCreated++;
        } catch (error: any) {
          result.errors.push(`Variants dòng ${rowNum}: ${error.message}`);
        }
      }

      // Import attributes
      for (let i = 0; i < attributes.length; i++) {
        const row = attributes[i];
        const rowNum = i + 2;

        try {
          await this.importAttribute(row, rowNum, result);
        } catch (error: any) {
          result.warnings.push(`Attributes dòng ${rowNum}: ${error.message}`);
        }
      }

      // Import media
      for (let i = 0; i < media.length; i++) {
        const row = media[i];
        const rowNum = i + 2;

        try {
          await this.importMedia(row, rowNum, result);
        } catch (error: any) {
          result.warnings.push(`Media dòng ${rowNum}: ${error.message}`);
        }
      }

      result.success = result.errors.length === 0;
    } catch (error: any) {
      result.errors.push(`Lỗi xử lý file: ${error.message}`);
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

  private async importProduct(row: ProductRow, rowNum: number, result: ImportResult): Promise<void> {
    if (!row.name || !row.sku_prefix || !row.base_price) {
      throw new Error("Thiếu trường bắt buộc: name, sku_prefix, hoặc base_price");
    }

    // Check if product already exists
    const existing = await this.productRepo.findOne({
      where: [
        { spk: row.sku_prefix },
        { slug: row.slug || slugify(row.name) }
      ]
    });
    if (existing) {
      throw new Error(`Sản phẩm với SKU prefix '${row.sku_prefix}' đã tồn tại`);
    }

    // Get or create brand
    let brand: Brand | null = null;
    if (row.brand_name) {
      brand = this.brandCache.get(row.brand_name.toLowerCase()) || null;
      if (!brand) {
        brand = this.brandRepo.create({
          name: row.brand_name,
          slug: slugify(row.brand_name),
          isActive: true,
        });
        brand = await this.brandRepo.save(brand);
        this.brandCache.set(row.brand_name.toLowerCase(), brand);
        result.warnings.push(`Dòng ${rowNum}: Tạo mới thương hiệu '${row.brand_name}'`);
      }
    }

    // Get or create category
    let category: Category | null = null;
    if (row.category_name) {
      category = this.categoryCache.get(row.category_name.toLowerCase()) || null;
      if (!category) {
        category = this.categoryRepo.create({
          name: row.category_name,
          slug: slugify(row.category_name),
          level: 1,
          displayOrder: 0,
          isActive: true,
        });
        category = await this.categoryRepo.save(category);
        this.categoryCache.set(row.category_name.toLowerCase(), category);
        result.warnings.push(`Dòng ${rowNum}: Tạo mới danh mục '${row.category_name}'`);
      }
    }

    // Create product
    const product = this.productRepo.create({
      name: row.name,
      spk: row.sku_prefix,
      slug: row.slug || slugify(row.name),
      brandId: brand?.id,
      categoryId: category?.id,
      basePrice: row.base_price,
      shortDescription: row.short_description,
      description: row.description,
      isFeatured: row.is_featured === true || row.is_featured?.toString().toLowerCase() === "true",
      status: (row.status as any) || "draft",
      metaTitle: row.meta_title,
      metaDescription: row.meta_description,
    });

    const savedProduct = await this.productRepo.save(product);
    this.productCache.set(row.sku_prefix.toLowerCase(), savedProduct);

    // Handle tags
    if (row.tags) {
      const tagNames = row.tags.split(",").map(t => t.trim()).filter(t => t);
      const productTags: Tag[] = [];

      for (const tagName of tagNames) {
        let tag = this.tagCache.get(tagName.toLowerCase());
        if (!tag) {
          tag = this.tagRepo.create({
            name: tagName,
            slug: slugify(tagName),
            type: "general" as any,
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
    let product = this.productCache.get(row.product_sku_prefix.toLowerCase());
    if (!product) {
      product = await this.productRepo.findOne({ where: { spk: row.product_sku_prefix } }) || undefined;
      if (product) {
        this.productCache.set(row.product_sku_prefix.toLowerCase(), product);
      }
    }

    if (!product) {
      throw new Error(`Không tìm thấy sản phẩm với SKU prefix '${row.product_sku_prefix}'`);
    }

    // Check if variant exists
    const existingVariant = await this.variantRepo.findOne({ where: { sku: row.sku } });
    if (existingVariant) {
      throw new Error(`Variant với SKU '${row.sku}' đã tồn tại`);
    }

    // Create variant
    const variant = this.variantRepo.create({
      productId: product.id,
      sku: row.sku,
      price: row.price,
      compareAtPrice: row.compare_at_price,
      costPrice: row.cost_price,
      stockQuantity: row.stock_quantity || 0,
      isDefault: row.is_default === true || row.is_default?.toString().toLowerCase() === "true",
      status: "active" as any,
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
      let optionType = this.optionTypeCache.get(opt.type.toLowerCase());
      if (!optionType) {
        optionType = this.optionTypeRepo.create({
          name: opt.type,
          slug: slugify(opt.type),
          displayOrder: 0,
        });
        optionType = await this.optionTypeRepo.save(optionType);
        this.optionTypeCache.set(opt.type.toLowerCase(), optionType);
      }

      // Get or create option value
      const valueKey = `${optionType.id}-${opt.value.toLowerCase()}`;
      let optionValue = this.optionValueCache.get(valueKey);
      if (!optionValue) {
        const foundValue = await this.optionValueRepo.findOne({
          where: { optionTypeId: optionType.id, value: opt.value }
        });
        if (foundValue) {
          optionValue = foundValue;
        } else {
          optionValue = this.optionValueRepo.create({
            optionTypeId: optionType.id,
            value: opt.value,
            displayValue: opt.value,
            colorCode: opt.colorCode,
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
        type: "image" as any,
        url: row.image_url,
        displayOrder: 0,
        isPrimary: row.is_default === true,
      });
      await this.mediaRepo.save(media);
    }
  }

  private async importAttribute(row: AttributeRow, rowNum: number, result: ImportResult): Promise<void> {
    if (!row.product_sku_prefix || !row.attribute_name || !row.value) {
      throw new Error("Thiếu trường bắt buộc");
    }

    // Find product
    let product = this.productCache.get(row.product_sku_prefix.toLowerCase());
    if (!product) {
      product = await this.productRepo.findOne({ where: { spk: row.product_sku_prefix } }) || undefined;
      if (product) {
        this.productCache.set(row.product_sku_prefix.toLowerCase(), product);
      }
    }

    if (!product) {
      throw new Error(`Không tìm thấy sản phẩm với SKU prefix '${row.product_sku_prefix}'`);
    }

    // Get or create attribute definition
    let attrDef = this.attributeDefCache.get(row.attribute_name.toLowerCase());
    if (!attrDef) {
      attrDef = this.attributeDefRepo.create({
        name: row.attribute_name,
        slug: slugify(row.attribute_name),
        dataType: AttributeDataType.TEXT,
        displayGroup: row.display_group || "Thông tin chung",
        displayOrder: row.display_order || 0,
        isFilterable: false,
        isComparable: true,
      });
      attrDef = await this.attributeDefRepo.save(attrDef);
      this.attributeDefCache.set(row.attribute_name.toLowerCase(), attrDef);
    }

    // Check if attribute already exists for this product
    const existing = await this.productAttributeRepo.findOne({
      where: { productId: product.id, attributeId: attrDef.id }
    });
    if (existing) {
      existing.value = row.value;
      await this.productAttributeRepo.save(existing);
    } else {
      const productAttr = this.productAttributeRepo.create({
        productId: product.id,
        attributeId: attrDef.id,
        value: row.value,
      });
      await this.productAttributeRepo.save(productAttr);
    }
  }

  private async importMedia(row: MediaRow, rowNum: number, result: ImportResult): Promise<void> {
    if (!row.product_sku_prefix || !row.url || !row.type) {
      throw new Error("Thiếu trường bắt buộc");
    }

    // Find product
    let product = this.productCache.get(row.product_sku_prefix.toLowerCase());
    if (!product) {
      product = await this.productRepo.findOne({ where: { spk: row.product_sku_prefix } }) || undefined;
      if (product) {
        this.productCache.set(row.product_sku_prefix.toLowerCase(), product);
      }
    }

    if (!product) {
      throw new Error(`Không tìm thấy sản phẩm với SKU prefix '${row.product_sku_prefix}'`);
    }

    const media = this.mediaRepo.create({
      productId: product.id,
      type: row.type as any,
      url: row.url,
      altText: row.alt_text,
      displayOrder: row.display_order || 0,
      isPrimary: row.is_primary === true || row.is_primary?.toString().toLowerCase() === "true",
    });
    await this.mediaRepo.save(media);
  }

  // Generate sample Excel template
  generateTemplate(): Buffer {
    const workbook = XLSX.utils.book_new();

    // Products sheet
    const productsData = [
      {
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
      },
    ];
    const productsSheet = XLSX.utils.json_to_sheet(productsData);
    XLSX.utils.book_append_sheet(workbook, productsSheet, "Products");

    // Variants sheet
    const variantsData = [
      {
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
      },
      {
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
        image_url: "",
      },
    ];
    const variantsSheet = XLSX.utils.json_to_sheet(variantsData);
    XLSX.utils.book_append_sheet(workbook, variantsSheet, "Variants");

    // Attributes sheet
    const attributesData = [
      { product_sku_prefix: "APL-IP-001", attribute_name: "Kích thước màn hình", value: "6.7 inch", display_group: "Màn hình", display_order: 1 },
      { product_sku_prefix: "APL-IP-001", attribute_name: "Công nghệ màn hình", value: "Super Retina XDR OLED", display_group: "Màn hình", display_order: 2 },
      { product_sku_prefix: "APL-IP-001", attribute_name: "Chip", value: "A17 Pro", display_group: "Cấu hình", display_order: 1 },
      { product_sku_prefix: "APL-IP-001", attribute_name: "RAM", value: "8GB", display_group: "Cấu hình", display_order: 2 },
    ];
    const attributesSheet = XLSX.utils.json_to_sheet(attributesData);
    XLSX.utils.book_append_sheet(workbook, attributesSheet, "Attributes");

    // Media sheet
    const mediaData = [
      { product_sku_prefix: "APL-IP-001", type: "image", url: "https://example.com/img1.jpg", alt_text: "iPhone 15 Pro Max", display_order: 1, is_primary: true },
      { product_sku_prefix: "APL-IP-001", type: "image", url: "https://example.com/img2.jpg", alt_text: "iPhone 15 Pro Max - Back", display_order: 2, is_primary: false },
    ];
    const mediaSheet = XLSX.utils.json_to_sheet(mediaData);
    XLSX.utils.book_append_sheet(workbook, mediaSheet, "Media");

    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }
}

export const productImportService = new ProductImportService();
