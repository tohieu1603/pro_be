import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRegionTables1703430000000 implements MigrationInterface {
  name = "CreateRegionTables1703430000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create regions table
    await queryRunner.query(`
      CREATE TABLE "regions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(200) NOT NULL,
        "subdomain" varchar(100) NOT NULL,
        "slug" varchar(100) NOT NULL,
        "description" text,
        "phone" varchar(20),
        "email" varchar(255),
        "address" text,
        "working_hours" varchar(200),
        "meta_title" varchar(200),
        "meta_description" text,
        "meta_keywords" varchar(500),
        "is_active" boolean NOT NULL DEFAULT true,
        "is_default" boolean NOT NULL DEFAULT false,
        "display_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_regions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_regions_subdomain" UNIQUE ("subdomain"),
        CONSTRAINT "UQ_regions_slug" UNIQUE ("slug")
      )
    `);

    // Create product_regions table
    await queryRunner.query(`
      CREATE TABLE "product_regions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "region_id" uuid NOT NULL,
        "price" decimal(15,2),
        "sale_price" decimal(15,2),
        "cost_price" decimal(15,2),
        "stock_quantity" integer NOT NULL DEFAULT 0,
        "low_stock_threshold" integer DEFAULT 10,
        "is_available" boolean NOT NULL DEFAULT true,
        "is_featured" boolean NOT NULL DEFAULT false,
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_regions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_product_region" UNIQUE ("product_id", "region_id"),
        CONSTRAINT "FK_product_regions_product" FOREIGN KEY ("product_id")
          REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_product_regions_region" FOREIGN KEY ("region_id")
          REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Create article_regions table (only if articles table exists)
    const articlesExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'articles'
      )
    `);

    if (articlesExists[0]?.exists) {
      await queryRunner.query(`
        CREATE TABLE "article_regions" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "article_id" uuid NOT NULL,
          "region_id" uuid NOT NULL,
          "is_featured" boolean NOT NULL DEFAULT false,
          "custom_title" varchar(300),
          "custom_excerpt" text,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_article_regions" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_article_region" UNIQUE ("article_id", "region_id"),
          CONSTRAINT "FK_article_regions_article" FOREIGN KEY ("article_id")
            REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
          CONSTRAINT "FK_article_regions_region" FOREIGN KEY ("region_id")
            REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        )
      `);
      await queryRunner.query(`CREATE INDEX "IDX_article_regions_article" ON "article_regions" ("article_id")`);
      await queryRunner.query(`CREATE INDEX "IDX_article_regions_region" ON "article_regions" ("region_id")`);
    }

    // Create indexes for better query performance
    await queryRunner.query(`CREATE INDEX "IDX_regions_subdomain" ON "regions" ("subdomain")`);
    await queryRunner.query(`CREATE INDEX "IDX_regions_slug" ON "regions" ("slug")`);
    await queryRunner.query(`CREATE INDEX "IDX_regions_is_active" ON "regions" ("is_active")`);
    await queryRunner.query(`CREATE INDEX "IDX_product_regions_product" ON "product_regions" ("product_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_product_regions_region" ON "product_regions" ("region_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_product_regions_available" ON "product_regions" ("is_available")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_article_regions_region"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_article_regions_article"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_regions_available"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_regions_region"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_regions_product"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_regions_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_regions_slug"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_regions_subdomain"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "article_regions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_regions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "regions"`);
  }
}
