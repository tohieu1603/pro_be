/**
 * Seed script for products (điều hòa, máy lọc không khí, quạt).
 * Requires base seed (`npm run seed`) already run so brands/categories/tags/regions exist.
 * Run: `npm run seed:products`
 */
import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { Brand } from "./entities/brand.entity";
import { Category } from "./entities/category.entity";
import { Tag } from "./entities/tag.entity";
import { Region } from "./entities/region.entity";
import { Product, ProductStatus } from "./entities/product.entity";
import { ProductVariant, VariantStatus } from "./entities/product-variant.entity";
import { ProductMedia, MediaType } from "./entities/product-media.entity";
import { ProductRegion } from "./entities/product-region.entity";

// Pollinations.ai free AI image URL builder. Seeds are stable so each product
// gets the same deterministic image across re-seeds (no API key needed).
const img = (prompt: string, seed: number) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}`;

// slugify with Vietnamese diacritic removal
const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

// Seed definition: product + variants; references brands/categories/tags by slug.
interface ProductSeed {
  spk: string;
  name: string;
  shortDescription: string;
  description: string;
  brandSlug: string;
  categorySlug: string;
  tagSlugs: string[];
  isFeatured: boolean;
  basePrice: number;
  imageUrl: string;
  variants: Array<{
    sku: string;
    name: string;
    price: number;
    compareAtPrice?: number;
    stockQuantity: number;
    isDefault?: boolean;
  }>;
}

const productSeeds: ProductSeed[] = [
  {
    spk: "SPK-DK-FTKB-001",
    name: "Điều hòa Daikin FTKB Inverter 1 chiều",
    shortDescription:
      "Điều hòa Daikin Inverter tiết kiệm điện, làm lạnh nhanh, công nghệ Coanda.",
    description:
      "Điều hòa Daikin FTKB series với công nghệ Inverter giúp tiết kiệm điện đến 50%. Luồng gió Coanda giúp phân phối khí mát đều khắp phòng. Hoạt động êm ái với độ ồn chỉ 21dB.",
    brandSlug: "daikin",
    categorySlug: "dieu-hoa-treo-tuong",
    tagSlugs: ["ban-chay", "inverter", "tiet-kiem-dien", "1-chieu"],
    isFeatured: true,
    basePrice: 8990000,
    imageUrl: img(
      "Product-only isolated shot of white Daikin FTKB wall-mounted split air conditioner indoor unit, NOTHING else in frame, pure white seamless studio background, no scene no environment, centered floating composition, soft subtle shadow directly below, Apple iPhone page product photography style, front 3/4 view, dramatic studio lighting, photorealistic commercial render",
      101,
    ),
    variants: [
      {
        sku: "DK-FTKB25-WHT",
        name: "9.000 BTU - Trắng",
        price: 8990000,
        compareAtPrice: 10500000,
        stockQuantity: 25,
        isDefault: true,
      },
      {
        sku: "DK-FTKB35-WHT",
        name: "12.000 BTU - Trắng",
        price: 10990000,
        compareAtPrice: 12500000,
        stockQuantity: 15,
      },
    ],
  },
  {
    spk: "SPK-PN-CU-N9",
    name: "Điều hòa Panasonic CU/CS-N9 Inverter Wifi",
    shortDescription:
      "Điều hòa Panasonic tích hợp Wifi điều khiển qua app, cảm biến Ecotough.",
    description:
      "Panasonic CU/CS-N9 với công nghệ Nanoe-G diệt khuẩn, Inverter tiết kiệm điện. Điều khiển từ xa qua app Panasonic Comfort Cloud.",
    brandSlug: "panasonic",
    categorySlug: "dieu-hoa-treo-tuong",
    tagSlugs: ["moi", "inverter", "wifi", "1-chieu"],
    isFeatured: true,
    basePrice: 9490000,
    imageUrl: img(
      "Product-only isolated shot of white Panasonic N9 Inverter Wifi split air conditioner indoor unit, NOTHING else in frame, pure white seamless studio background, no scene no environment, centered floating composition, soft subtle shadow below, Apple iPhone page product photography style, front 3/4 view, dramatic studio lighting, photorealistic",
      102,
    ),
    variants: [
      {
        sku: "PN-N9-9K",
        name: "9.000 BTU",
        price: 9490000,
        compareAtPrice: 11200000,
        stockQuantity: 30,
        isDefault: true,
      },
      {
        sku: "PN-N12-12K",
        name: "12.000 BTU",
        price: 11990000,
        compareAtPrice: 13500000,
        stockQuantity: 20,
      },
      {
        sku: "PN-N18-18K",
        name: "18.000 BTU",
        price: 17990000,
        compareAtPrice: 19500000,
        stockQuantity: 8,
      },
    ],
  },
  {
    spk: "SPK-LG-V10",
    name: "Điều hòa LG V10 Dual Inverter 2 chiều",
    shortDescription:
      "Điều hòa LG Dual Inverter 2 chiều lạnh/sưởi, kháng khuẩn UVnano.",
    description:
      "LG V10 series với công nghệ Dual Inverter tiết kiệm 70% điện so với dòng thường. Chế độ 2 chiều cho mùa đông lẫn mùa hè, đèn UV diệt khuẩn trên cánh quạt.",
    brandSlug: "lg",
    categorySlug: "dieu-hoa-treo-tuong",
    tagSlugs: ["inverter", "wifi", "2-chieu", "tiet-kiem-dien"],
    isFeatured: true,
    basePrice: 13990000,
    imageUrl: img(
      "Product-only isolated shot of white LG V10 Dual Inverter split air conditioner indoor unit, NOTHING else in frame, pure white seamless studio background, no scene no environment, centered floating composition, soft subtle shadow below, Apple product photography aesthetic, front 3/4 view, dramatic studio lighting, photorealistic commercial render",
      103,
    ),
    variants: [
      {
        sku: "LG-V10-9K-2C",
        name: "9.000 BTU - 2 chiều",
        price: 13990000,
        compareAtPrice: 15500000,
        stockQuantity: 12,
        isDefault: true,
      },
      {
        sku: "LG-V10-12K-2C",
        name: "12.000 BTU - 2 chiều",
        price: 16490000,
        compareAtPrice: 18000000,
        stockQuantity: 10,
      },
    ],
  },
  {
    spk: "SPK-ME-MSZ-HR",
    name: "Điều hòa Mitsubishi Electric MSZ-HR Inverter",
    shortDescription:
      "Điều hòa Mitsubishi Electric cao cấp, công nghệ 3D i-See, chế độ Econo Cool.",
    description:
      "Mitsubishi Electric MSZ-HR với cảm biến 3D i-See phát hiện vị trí người để điều chỉnh luồng gió tối ưu. Chế độ Econo Cool giúp tiết kiệm 20% điện mà vẫn giữ cảm giác mát mẻ.",
    brandSlug: "mitsubishi-electric",
    categorySlug: "dieu-hoa-treo-tuong",
    tagSlugs: ["inverter", "1-chieu", "tiet-kiem-dien"],
    isFeatured: false,
    basePrice: 12490000,
    imageUrl: img(
      "Product-only isolated shot of white Mitsubishi Electric MSZ-HR split air conditioner indoor unit, NOTHING else in frame, pure white seamless studio background, no scene no environment, centered floating composition, soft subtle shadow below, Apple product photography aesthetic, Japanese precision engineering, front 3/4 view, photorealistic",
      104,
    ),
    variants: [
      {
        sku: "ME-HR25-9K",
        name: "9.000 BTU",
        price: 12490000,
        stockQuantity: 18,
        isDefault: true,
      },
    ],
  },
  {
    spk: "SPK-CP-EC",
    name: "Điều hòa Casper EC Non-Inverter",
    shortDescription:
      "Điều hòa Casper giá tốt, làm lạnh nhanh, phù hợp nhà trọ, phòng ngủ.",
    description:
      "Casper EC series giá cả phải chăng với chất lượng ổn định. Làm lạnh nhanh, lọc bụi PM2.5, gas R32 thân thiện môi trường.",
    brandSlug: "casper",
    categorySlug: "dieu-hoa-treo-tuong",
    tagSlugs: ["giam-gia", "freeship", "1-chieu"],
    isFeatured: false,
    basePrice: 5490000,
    imageUrl: img(
      "Product-only isolated shot of white Casper EC split air conditioner indoor unit, NOTHING else in frame, pure white seamless studio background, no scene no environment, centered floating composition, soft subtle shadow below, Apple product photography aesthetic, simple clean design, front 3/4 view, photorealistic",
      105,
    ),
    variants: [
      {
        sku: "CP-EC09-9K",
        name: "9.000 BTU",
        price: 5490000,
        compareAtPrice: 6200000,
        stockQuantity: 50,
        isDefault: true,
      },
      {
        sku: "CP-EC12-12K",
        name: "12.000 BTU",
        price: 6990000,
        compareAtPrice: 7800000,
        stockQuantity: 35,
      },
    ],
  },
  {
    spk: "SPK-SS-ATR",
    name: "Điều hòa Samsung ATR WindFree Inverter",
    shortDescription:
      "Điều hòa Samsung công nghệ WindFree không luồng gió lạnh trực tiếp.",
    description:
      "Samsung WindFree phân tán không khí qua 23.000 lỗ siêu nhỏ, mang đến cảm giác mát mẻ không cảm nhận được luồng gió. AI Auto Cooling tự học thói quen người dùng.",
    brandSlug: "samsung",
    categorySlug: "dieu-hoa-treo-tuong",
    tagSlugs: ["moi", "inverter", "wifi"],
    isFeatured: true,
    basePrice: 15990000,
    imageUrl: img(
      "Product-only isolated shot of white Samsung WindFree split air conditioner indoor unit with distinctive micro-hole front panel, NOTHING else in frame, pure white seamless studio background, no scene no environment, centered floating composition, soft subtle shadow below, Apple product photography aesthetic, front 3/4 view, dramatic studio lighting, photorealistic",
      106,
    ),
    variants: [
      {
        sku: "SS-ATR09-9K",
        name: "9.000 BTU WindFree",
        price: 15990000,
        compareAtPrice: 17500000,
        stockQuantity: 14,
        isDefault: true,
      },
      {
        sku: "SS-ATR12-12K",
        name: "12.000 BTU WindFree",
        price: 18990000,
        compareAtPrice: 20500000,
        stockQuantity: 9,
      },
    ],
  },
  {
    spk: "SPK-SH-KC",
    name: "Máy lọc không khí Sharp KC-G40EV-W",
    shortDescription:
      "Máy lọc không khí Sharp tích hợp Plasmacluster Ion, tạo ẩm tự động.",
    description:
      "Sharp KC-G40EV-W lọc bụi mịn PM2.5, diệt virus và vi khuẩn với công nghệ Plasmacluster Ion độc quyền. Phù hợp phòng 28m².",
    brandSlug: "sharp",
    categorySlug: "may-loc-khi-gia-dinh",
    tagSlugs: ["ban-chay", "ion-am", "loc-bui-min"],
    isFeatured: false,
    basePrice: 6490000,
    imageUrl: img(
      "Product-only isolated shot of white Sharp KC-G40 tower air purifier and humidifier, NOTHING else in frame, pure white seamless studio background, no scene no environment, centered floating vertical composition, soft subtle shadow below, Apple product photography aesthetic, Japanese minimalist design, front view, photorealistic",
      107,
    ),
    variants: [
      {
        sku: "SH-KC-G40EV",
        name: "Trắng",
        price: 6490000,
        compareAtPrice: 7200000,
        stockQuantity: 22,
        isDefault: true,
      },
    ],
  },
  {
    spk: "SPK-PN-FV",
    name: "Quạt điều hòa Panasonic FV-30NL3",
    shortDescription:
      "Quạt điều hòa Panasonic công suất lớn, tiết kiệm điện, 3 cấp độ gió.",
    description:
      "Quạt điều hòa Panasonic FV-30NL3 với màng làm mát Honeycomb, bình chứa nước 8L, điều khiển từ xa, chế độ ngủ.",
    brandSlug: "panasonic",
    categorySlug: "quat-dieu-hoa",
    tagSlugs: ["freeship", "tiet-kiem-dien"],
    isFeatured: false,
    basePrice: 3290000,
    imageUrl: img(
      "Product-only isolated shot of white Panasonic FV-30 portable evaporative cooler tower fan with water tank, NOTHING else in frame, pure white seamless studio background, no scene no environment, centered floating vertical composition, soft subtle shadow below, Apple product photography aesthetic, front 3/4 view, photorealistic",
      108,
    ),
    variants: [
      {
        sku: "PN-FV30-WHT",
        name: "Trắng",
        price: 3290000,
        compareAtPrice: 3800000,
        stockQuantity: 40,
        isDefault: true,
      },
    ],
  },
];

async function seed() {
  console.log("🌱 Starting product seeding...\n");
  await AppDataSource.initialize();
  console.log("✅ Database connected\n");

  const brandRepo = AppDataSource.getRepository(Brand);
  const categoryRepo = AppDataSource.getRepository(Category);
  const tagRepo = AppDataSource.getRepository(Tag);
  const regionRepo = AppDataSource.getRepository(Region);
  const productRepo = AppDataSource.getRepository(Product);
  const variantRepo = AppDataSource.getRepository(ProductVariant);
  const mediaRepo = AppDataSource.getRepository(ProductMedia);
  const productRegionRepo = AppDataSource.getRepository(ProductRegion);

  // Clear products first (CASCADE handles variants/media/product_tags/product_regions)
  console.log("🗑️  Clearing existing products...");
  await AppDataSource.query("TRUNCATE TABLE products CASCADE");
  console.log("✅ Products cleared\n");

  // Build lookup maps keyed by slug
  const brands = await brandRepo.find();
  const categories = await categoryRepo.find();
  const tags = await tagRepo.find();
  const regions = await regionRepo.find();

  const brandMap = new Map(brands.map((b) => [b.slug, b]));
  const categoryMap = new Map(categories.map((c) => [c.slug, c]));
  const tagMap = new Map(tags.map((t) => [t.slug, t]));

  if (brands.length === 0 || categories.length === 0 || regions.length === 0) {
    throw new Error(
      "Missing base data. Please run `npm run seed` before seeding products.",
    );
  }

  let productCount = 0;
  let variantCount = 0;

  for (const seed of productSeeds) {
    const brand = brandMap.get(seed.brandSlug);
    const category = categoryMap.get(seed.categorySlug);
    if (!brand || !category) {
      console.warn(
        `⚠️  Skipping ${seed.spk}: missing brand(${seed.brandSlug}) or category(${seed.categorySlug})`,
      );
      continue;
    }

    // Create product
    const product = await productRepo.save(
      productRepo.create({
        spk: seed.spk,
        name: seed.name,
        slug: slugify(seed.name),
        description: seed.description,
        shortDescription: seed.shortDescription,
        brandId: brand.id,
        categoryId: category.id,
        basePrice: seed.basePrice,
        status: ProductStatus.ACTIVE,
        isFeatured: seed.isFeatured,
        publishedAt: new Date(),
        metaTitle: seed.name,
        metaDescription: seed.shortDescription,
        tags: seed.tagSlugs
          .map((s) => tagMap.get(s))
          .filter((t): t is Tag => !!t),
      }),
    );
    productCount++;

    // Create variants
    for (const v of seed.variants) {
      await variantRepo.save(
        variantRepo.create({
          productId: product.id,
          sku: v.sku,
          name: v.name,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stockQuantity: v.stockQuantity,
          isDefault: !!v.isDefault,
          status: VariantStatus.ACTIVE,
          trackInventory: true,
        }),
      );
      variantCount++;
    }

    // Primary image
    await mediaRepo.save(
      mediaRepo.create({
        productId: product.id,
        type: MediaType.IMAGE,
        url: seed.imageUrl,
        altText: seed.name,
        isPrimary: true,
        displayOrder: 0,
      }),
    );

    // Availability in every region (copy basePrice as regional price)
    for (const region of regions) {
      await productRegionRepo.save(
        productRegionRepo.create({
          productId: product.id,
          regionId: region.id,
          price: seed.basePrice,
          stockQuantity: seed.variants.reduce((s, v) => s + v.stockQuantity, 0),
          isAvailable: true,
        }),
      );
    }

    console.log(`  ✓ ${product.spk} — ${product.name}`);
  }

  console.log("\n═══════════════════════════════════════");
  console.log("      PRODUCT SEED SUMMARY             ");
  console.log("═══════════════════════════════════════");
  console.log(`📦 Products: ${productCount}`);
  console.log(`🎨 Variants: ${variantCount}`);
  console.log(`🌍 Regional mappings: ${productCount * regions.length}`);
  console.log("═══════════════════════════════════════\n");

  await AppDataSource.destroy();
  console.log("🎉 Product seeding completed!");
}

seed().catch((error) => {
  console.error("❌ Product seeding failed:", error);
  process.exit(1);
});
