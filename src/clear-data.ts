import "reflect-metadata";
import { AppDataSource } from "./data-source";

async function clearData() {
  console.log("Clearing all data...\n");

  await AppDataSource.initialize();
  console.log("Database connected\n");

  const tables = [
    "inventory_movements",
    "inventory",
    "product_variant_options",
    "product_variants",
    "product_tags",
    "product_attributes",
    "product_media",
    "product_reviews",
    "review_replies",
    "product_questions",
    "question_answers",
    "flash_sale_items",
    "flash_sales",
    "price_rules",
    "product_relations",
    "product_regions",
    "products",
    "variant_option_values",
    "variant_option_types",
    "attribute_definitions",
    "categories",
    "brands",
    "tags",
    "warehouses",
    "promotions",
    "service_infos",
    "article_regions",
    "articles",
    "article_categories",
    "regions",
    "refresh_tokens",
    "users"
  ];

  for (const table of tables) {
    try {
      await AppDataSource.query(`TRUNCATE TABLE ${table} CASCADE`);
      console.log(`Cleared ${table}`);
    } catch (e: any) {
      if (!e.message?.includes("does not exist")) {
        console.log(`Skip ${table}`);
      }
    }
  }

  console.log("\nAll data cleared!");
  await AppDataSource.destroy();
}

clearData().catch(console.error);
