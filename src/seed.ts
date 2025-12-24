import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { Brand } from "./entities/brand.entity";
import { Category } from "./entities/category.entity";
import { Product, ProductStatus } from "./entities/product.entity";
import { ProductVariant, VariantStatus } from "./entities/product-variant.entity";
import { Tag, TagType } from "./entities/tag.entity";
import { Warehouse } from "./entities/warehouse.entity";
import { Inventory } from "./entities/inventory.entity";
import { Region } from "./entities/region.entity";
import { User, UserRole } from "./entities/user.entity";
import { VariantOptionType } from "./entities/variant-option-type.entity";
import { VariantOptionValue } from "./entities/variant-option-value.entity";
import { ProductVariantOption } from "./entities/product-variant-option.entity";
import * as bcrypt from "bcryptjs";

// Helper to generate slug
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

// Helper to generate random number in range
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to generate random price
const randomPrice = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) / 100000) * 100000;

async function seed() {
  console.log("🌱 Starting database seeding...\n");

  await AppDataSource.initialize();
  console.log("✅ Database connected\n");

  // Clear existing data (in reverse order of dependencies)
  console.log("🗑️  Clearing existing data...");
  await AppDataSource.query("TRUNCATE TABLE inventory CASCADE");
  await AppDataSource.query("TRUNCATE TABLE product_variant_options CASCADE");
  await AppDataSource.query("TRUNCATE TABLE product_variants CASCADE");
  await AppDataSource.query("TRUNCATE TABLE product_tags CASCADE");
  await AppDataSource.query("TRUNCATE TABLE products CASCADE");
  await AppDataSource.query("TRUNCATE TABLE variant_option_values CASCADE");
  await AppDataSource.query("TRUNCATE TABLE variant_option_types CASCADE");
  await AppDataSource.query("TRUNCATE TABLE categories CASCADE");
  await AppDataSource.query("TRUNCATE TABLE brands CASCADE");
  await AppDataSource.query("TRUNCATE TABLE tags CASCADE");
  await AppDataSource.query("TRUNCATE TABLE warehouses CASCADE");
  await AppDataSource.query("TRUNCATE TABLE regions CASCADE");
  await AppDataSource.query("TRUNCATE TABLE refresh_tokens CASCADE");
  await AppDataSource.query("TRUNCATE TABLE users CASCADE");
  console.log("✅ Data cleared\n");

  // ========== USERS ==========
  console.log("👤 Creating users...");
  const userRepo = AppDataSource.getRepository(User);
  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  const users = await userRepo.save([
    {
      email: "admin@example.com",
      password: hashedPassword,
      name: "Admin",
      role: UserRole.ADMIN,
      isActive: true,
    },
    {
      email: "user@example.com",
      password: hashedPassword,
      name: "Nguyễn Văn A",
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: "manager@example.com",
      password: hashedPassword,
      name: "Trần Thị B",
      role: UserRole.ADMIN,
      isActive: true,
    },
  ]);
  console.log(`✅ Created ${users.length} users\n`);

  // ========== REGIONS ==========
  console.log("🌍 Creating regions...");
  const regionRepo = AppDataSource.getRepository(Region);

  const regions = await regionRepo.save([
    {
      name: "Hà Nội",
      slug: "ha-noi",
      subdomain: "hanoi",
      phone: "024 1234 5678",
      email: "hanoi@dieuhoaxyz.vn",
      address: "123 Cầu Giấy, Hà Nội",
      city: "Hà Nội",
      province: "Hà Nội",
      latitude: 21.0285,
      longitude: 105.8542,
      shippingFee: 30000,
      freeShippingThreshold: 5000000,
      displayOrder: 1,
      isDefault: true,
      isActive: true,
      workingHours: {
        monday: "8:00 - 18:00",
        tuesday: "8:00 - 18:00",
        wednesday: "8:00 - 18:00",
        thursday: "8:00 - 18:00",
        friday: "8:00 - 18:00",
        saturday: "8:00 - 12:00",
        sunday: "Nghỉ",
      },
    },
    {
      name: "Hồ Chí Minh",
      slug: "ho-chi-minh",
      subdomain: "hcm",
      phone: "028 9876 5432",
      email: "hcm@dieuhoaxyz.vn",
      address: "456 Nguyễn Huệ, Quận 1",
      city: "Hồ Chí Minh",
      province: "Hồ Chí Minh",
      latitude: 10.8231,
      longitude: 106.6297,
      shippingFee: 35000,
      freeShippingThreshold: 3000000,
      displayOrder: 2,
      isDefault: false,
      isActive: true,
    },
    {
      name: "Đà Nẵng",
      slug: "da-nang",
      subdomain: "danang",
      phone: "0236 3456 789",
      email: "danang@dieuhoaxyz.vn",
      address: "789 Hải Châu, Đà Nẵng",
      city: "Đà Nẵng",
      province: "Đà Nẵng",
      latitude: 16.0544,
      longitude: 108.2022,
      shippingFee: 40000,
      freeShippingThreshold: 4000000,
      displayOrder: 3,
      isDefault: false,
      isActive: true,
    },
  ]);
  console.log(`✅ Created ${regions.length} regions\n`);

  // ========== BRANDS ==========
  console.log("🏷️  Creating brands...");
  const brandRepo = AppDataSource.getRepository(Brand);

  const brandsData = [
    { name: "Daikin", country: "Nhật Bản", website: "https://daikin.com.vn", description: "Thương hiệu điều hòa hàng đầu Nhật Bản" },
    { name: "Panasonic", country: "Nhật Bản", website: "https://panasonic.com.vn", description: "Tập đoàn điện tử đa quốc gia" },
    { name: "LG", country: "Hàn Quốc", website: "https://lg.com.vn", description: "Thương hiệu điện tử hàng đầu Hàn Quốc" },
    { name: "Samsung", country: "Hàn Quốc", website: "https://samsung.com.vn", description: "Tập đoàn công nghệ hàng đầu thế giới" },
    { name: "Mitsubishi Electric", country: "Nhật Bản", website: "https://mitsubishielectric.com.vn", description: "Điều hòa cao cấp Nhật Bản" },
    { name: "Toshiba", country: "Nhật Bản", website: "https://toshiba.com.vn", description: "Thương hiệu điện tử lâu đời" },
    { name: "Gree", country: "Trung Quốc", website: "https://gree.com.vn", description: "Hãng điều hòa lớn nhất thế giới" },
    { name: "Casper", country: "Thái Lan", website: "https://casper.vn", description: "Điều hòa giá rẻ chất lượng" },
    { name: "Midea", country: "Trung Quốc", website: "https://midea.com.vn", description: "Điện gia dụng giá tốt" },
    { name: "Sharp", country: "Nhật Bản", website: "https://sharp.com.vn", description: "Công nghệ Plasmacluster" },
  ];

  const brands = await brandRepo.save(
    brandsData.map((b) => ({
      ...b,
      slug: slugify(b.name),
      isActive: true,
    }))
  );
  console.log(`✅ Created ${brands.length} brands\n`);

  // ========== CATEGORIES ==========
  console.log("📁 Creating categories...");
  const categoryRepo = AppDataSource.getRepository(Category);

  // Parent categories
  const parentCategories = await categoryRepo.save([
    { name: "Điều hòa", slug: "dieu-hoa", displayOrder: 1, level: 0, isActive: true },
    { name: "Máy lọc không khí", slug: "may-loc-khong-khi", displayOrder: 2, level: 0, isActive: true },
    { name: "Quạt", slug: "quat", displayOrder: 3, level: 0, isActive: true },
    { name: "Phụ kiện", slug: "phu-kien", displayOrder: 4, level: 0, isActive: true },
  ]);

  // Child categories for "Điều hòa"
  const dieuHoaChildren = await categoryRepo.save([
    { name: "Điều hòa treo tường", slug: "dieu-hoa-treo-tuong", parentId: parentCategories[0].id, displayOrder: 1, level: 1, path: parentCategories[0].id, isActive: true },
    { name: "Điều hòa âm trần", slug: "dieu-hoa-am-tran", parentId: parentCategories[0].id, displayOrder: 2, level: 1, path: parentCategories[0].id, isActive: true },
    { name: "Điều hòa tủ đứng", slug: "dieu-hoa-tu-dung", parentId: parentCategories[0].id, displayOrder: 3, level: 1, path: parentCategories[0].id, isActive: true },
    { name: "Điều hòa multi", slug: "dieu-hoa-multi", parentId: parentCategories[0].id, displayOrder: 4, level: 1, path: parentCategories[0].id, isActive: true },
  ]);

  // Child categories for "Máy lọc không khí"
  const mayLocChildren = await categoryRepo.save([
    { name: "Máy lọc khí gia đình", slug: "may-loc-khi-gia-dinh", parentId: parentCategories[1].id, displayOrder: 1, level: 1, path: parentCategories[1].id, isActive: true },
    { name: "Máy lọc khí văn phòng", slug: "may-loc-khi-van-phong", parentId: parentCategories[1].id, displayOrder: 2, level: 1, path: parentCategories[1].id, isActive: true },
  ]);

  // Child categories for "Quạt"
  const quatChildren = await categoryRepo.save([
    { name: "Quạt điều hòa", slug: "quat-dieu-hoa", parentId: parentCategories[2].id, displayOrder: 1, level: 1, path: parentCategories[2].id, isActive: true },
    { name: "Quạt đứng", slug: "quat-dung", parentId: parentCategories[2].id, displayOrder: 2, level: 1, path: parentCategories[2].id, isActive: true },
    { name: "Quạt trần", slug: "quat-tran", parentId: parentCategories[2].id, displayOrder: 3, level: 1, path: parentCategories[2].id, isActive: true },
  ]);

  const allCategories = [...parentCategories, ...dieuHoaChildren, ...mayLocChildren, ...quatChildren];
  console.log(`✅ Created ${allCategories.length} categories\n`);

  // ========== TAGS ==========
  console.log("🏷️  Creating tags...");
  const tagRepo = AppDataSource.getRepository(Tag);

  const tags = await tagRepo.save([
    { name: "Bán chạy", slug: "ban-chay", type: TagType.BADGE },
    { name: "Mới", slug: "moi", type: TagType.BADGE },
    { name: "Giảm giá", slug: "giam-gia", type: TagType.PROMOTION },
    { name: "Freeship", slug: "freeship", type: TagType.PROMOTION },
    { name: "Inverter", slug: "inverter", type: TagType.GENERAL },
    { name: "Tiết kiệm điện", slug: "tiet-kiem-dien", type: TagType.GENERAL },
    { name: "Wifi", slug: "wifi", type: TagType.GENERAL },
    { name: "Ion âm", slug: "ion-am", type: TagType.GENERAL },
    { name: "Lọc bụi mịn", slug: "loc-bui-min", type: TagType.GENERAL },
    { name: "1 chiều", slug: "1-chieu", type: TagType.GENERAL },
    { name: "2 chiều", slug: "2-chieu", type: TagType.GENERAL },
  ]);
  console.log(`✅ Created ${tags.length} tags\n`);

  // ========== WAREHOUSES ==========
  console.log("🏭 Creating warehouses...");
  const warehouseRepo = AppDataSource.getRepository(Warehouse);

  const warehouses = await warehouseRepo.save([
    { name: "Kho Hà Nội", code: "WH-HN", address: "Số 100, Đường Láng, Đống Đa", city: "Hà Nội", province: "Hà Nội", isActive: true },
    { name: "Kho Hồ Chí Minh", code: "WH-HCM", address: "Số 200, Điện Biên Phủ, Quận 3", city: "Hồ Chí Minh", province: "Hồ Chí Minh", isActive: true },
    { name: "Kho Đà Nẵng", code: "WH-DN", address: "Số 50, Nguyễn Văn Linh", city: "Đà Nẵng", province: "Đà Nẵng", isActive: true },
  ]);
  console.log(`✅ Created ${warehouses.length} warehouses\n`);

  // ========== VARIANT OPTION TYPES ==========
  console.log("⚙️  Creating variant option types...");
  const optionTypeRepo = AppDataSource.getRepository(VariantOptionType);

  const optionTypes = await optionTypeRepo.save([
    { name: "Công suất", slug: "cong-suat", displayOrder: 1 },
    { name: "Màu sắc", slug: "mau-sac", displayOrder: 2 },
    { name: "Loại máy", slug: "loai-may", displayOrder: 3 },
  ]);

  // ========== VARIANT OPTION VALUES ==========
  console.log("⚙️  Creating variant option values...");
  const optionValueRepo = AppDataSource.getRepository(VariantOptionValue);

  // Công suất values
  const congSuatValues = await optionValueRepo.save([
    { optionTypeId: optionTypes[0].id, value: "9000BTU", displayValue: "9.000 BTU (1HP)", displayOrder: 1 },
    { optionTypeId: optionTypes[0].id, value: "12000BTU", displayValue: "12.000 BTU (1.5HP)", displayOrder: 2 },
    { optionTypeId: optionTypes[0].id, value: "18000BTU", displayValue: "18.000 BTU (2HP)", displayOrder: 3 },
    { optionTypeId: optionTypes[0].id, value: "24000BTU", displayValue: "24.000 BTU (2.5HP)", displayOrder: 4 },
  ]);

  // Màu sắc values
  const mauSacValues = await optionValueRepo.save([
    { optionTypeId: optionTypes[1].id, value: "Trắng", displayValue: "Trắng", colorCode: "#FFFFFF", displayOrder: 1 },
    { optionTypeId: optionTypes[1].id, value: "Đen", displayValue: "Đen", colorCode: "#000000", displayOrder: 2 },
    { optionTypeId: optionTypes[1].id, value: "Bạc", displayValue: "Bạc", colorCode: "#C0C0C0", displayOrder: 3 },
  ]);

  // Loại máy values
  const loaiMayValues = await optionValueRepo.save([
    { optionTypeId: optionTypes[2].id, value: "1-chieu", displayValue: "1 chiều (làm lạnh)", displayOrder: 1 },
    { optionTypeId: optionTypes[2].id, value: "2-chieu", displayValue: "2 chiều (lạnh/sưởi)", displayOrder: 2 },
  ]);

  console.log(`✅ Created ${optionTypes.length} option types with values\n`);

  // ========== PRODUCTS ==========
  console.log("📦 Creating products...");
  const productRepo = AppDataSource.getRepository(Product);
  const variantRepo = AppDataSource.getRepository(ProductVariant);
  const variantOptionRepo = AppDataSource.getRepository(ProductVariantOption);
  const inventoryRepo = AppDataSource.getRepository(Inventory);

  // Product templates
  const productTemplates = [
    { brand: 0, category: 4, nameTemplate: "Điều hòa Daikin Inverter", baseSKU: "DK-INV" },
    { brand: 0, category: 4, nameTemplate: "Điều hòa Daikin Standard", baseSKU: "DK-STD" },
    { brand: 1, category: 4, nameTemplate: "Điều hòa Panasonic CU/CS", baseSKU: "PN-CS" },
    { brand: 1, category: 4, nameTemplate: "Điều hòa Panasonic Inverter Sky", baseSKU: "PN-SKY" },
    { brand: 2, category: 4, nameTemplate: "Điều hòa LG Dual Inverter", baseSKU: "LG-DI" },
    { brand: 2, category: 4, nameTemplate: "Điều hòa LG Dualcool", baseSKU: "LG-DC" },
    { brand: 3, category: 4, nameTemplate: "Điều hòa Samsung WindFree", baseSKU: "SS-WF" },
    { brand: 3, category: 4, nameTemplate: "Điều hòa Samsung Digital Inverter", baseSKU: "SS-DI" },
    { brand: 4, category: 5, nameTemplate: "Điều hòa Mitsubishi âm trần", baseSKU: "MT-AT" },
    { brand: 5, category: 4, nameTemplate: "Điều hòa Toshiba Inverter", baseSKU: "TB-INV" },
    { brand: 6, category: 4, nameTemplate: "Điều hòa Gree Inverter", baseSKU: "GR-INV" },
    { brand: 7, category: 4, nameTemplate: "Điều hòa Casper Inverter", baseSKU: "CP-INV" },
    { brand: 8, category: 4, nameTemplate: "Điều hòa Midea Inverter", baseSKU: "MD-INV" },
    { brand: 9, category: 4, nameTemplate: "Điều hòa Sharp Plasmacluster", baseSKU: "SH-PC" },
    { brand: 1, category: 8, nameTemplate: "Máy lọc không khí Panasonic", baseSKU: "PN-AP" },
    { brand: 3, category: 8, nameTemplate: "Máy lọc không khí Samsung", baseSKU: "SS-AP" },
    { brand: 9, category: 8, nameTemplate: "Máy lọc không khí Sharp", baseSKU: "SH-AP" },
    { brand: 8, category: 10, nameTemplate: "Quạt điều hòa Midea", baseSKU: "MD-QD" },
    { brand: 1, category: 11, nameTemplate: "Quạt đứng Panasonic", baseSKU: "PN-QD" },
  ];

  const createdProducts: Product[] = [];
  const createdVariants: ProductVariant[] = [];
  let skuCounter = 1000;

  for (const template of productTemplates) {
    const tagIndices = [randomInt(0, 3), randomInt(4, 8)]; // Random 2 tags
    const selectedTags = tagIndices.map((i) => tags[i]);

    const product = await productRepo.save({
      spk: `SPK-${String(skuCounter++).padStart(6, "0")}`,
      name: template.nameTemplate,
      slug: slugify(template.nameTemplate) + "-" + Date.now(),
      description: `<p>${template.nameTemplate} với công nghệ tiên tiến, tiết kiệm điện năng, vận hành êm ái.</p><ul><li>Công nghệ Inverter tiết kiệm điện</li><li>Lọc bụi mịn PM2.5</li><li>Chế độ ngủ thông minh</li></ul>`,
      shortDescription: `${template.nameTemplate} - Tiết kiệm điện, vận hành êm ái`,
      brandId: brands[template.brand].id,
      categoryId: allCategories[template.category].id,
      basePrice: randomPrice(5000000, 15000000),
      metaTitle: template.nameTemplate,
      metaDescription: `Mua ${template.nameTemplate} chính hãng, giá tốt nhất`,
      metaKeywords: [template.nameTemplate.split(" ")[2], "điều hòa", "inverter"],
      status: ProductStatus.ACTIVE,
      isFeatured: Math.random() > 0.7,
      tags: selectedTags,
    });

    createdProducts.push(product);

    // Create variants for each product (based on Công suất)
    for (let i = 0; i < congSuatValues.length; i++) {
      const congSuat = congSuatValues[i];
      const priceMultiplier = 1 + i * 0.25; // Higher BTU = higher price
      const variantPrice = Math.round(Number(product.basePrice) * priceMultiplier);

      const variant = await variantRepo.save({
        productId: product.id,
        sku: `${template.baseSKU}-${congSuat.value}-${skuCounter++}`,
        name: `${product.name} ${congSuat.displayValue}`,
        price: variantPrice,
        compareAtPrice: Math.round(variantPrice * 1.15),
        costPrice: Math.round(variantPrice * 0.7),
        stockQuantity: randomInt(10, 100),
        lowStockThreshold: 5,
        trackInventory: true,
        allowBackorder: false,
        weight: 30 + i * 5,
        weightUnit: "kg",
        isDefault: i === 0,
        status: VariantStatus.ACTIVE,
      });

      createdVariants.push(variant);

      // Create variant option (link to Công suất value)
      await variantOptionRepo.save({
        variantId: variant.id,
        optionTypeId: optionTypes[0].id,
        optionValueId: congSuat.id,
      });

      // Create inventory for each warehouse
      for (const warehouse of warehouses) {
        await inventoryRepo.save({
          variantId: variant.id,
          warehouseId: warehouse.id,
          quantity: randomInt(5, 50),
          reservedQuantity: randomInt(0, 5),
        });
      }
    }
  }

  console.log(`✅ Created ${createdProducts.length} products`);
  console.log(`✅ Created ${createdVariants.length} variants`);
  console.log(`✅ Created inventory records for all variants\n`);

  // ========== SUMMARY ==========
  console.log("═══════════════════════════════════════");
  console.log("        SEED DATA SUMMARY              ");
  console.log("═══════════════════════════════════════");
  console.log(`👤 Users:       ${users.length}`);
  console.log(`🌍 Regions:     ${regions.length}`);
  console.log(`🏷️  Brands:      ${brands.length}`);
  console.log(`📁 Categories:  ${allCategories.length}`);
  console.log(`🏷️  Tags:        ${tags.length}`);
  console.log(`🏭 Warehouses:  ${warehouses.length}`);
  console.log(`⚙️  Option Types: ${optionTypes.length}`);
  console.log(`📦 Products:    ${createdProducts.length}`);
  console.log(`📦 Variants:    ${createdVariants.length}`);
  console.log("═══════════════════════════════════════");
  console.log("\n🎉 Database seeding completed!\n");
  console.log("Login credentials:");
  console.log("  Email: admin@example.com");
  console.log("  Password: Admin@123");

  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
