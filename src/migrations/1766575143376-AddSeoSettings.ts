import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSeoSettings1766575143376 implements MigrationInterface {
    name = 'AddSeoSettings1766575143376'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "seo_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying(50) NOT NULL, "value" text NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_597862c39f7d83a29d821924d5e" UNIQUE ("key"), CONSTRAINT "PK_4ce8e4254875c1060ceeeed8b41" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "seo_settings"`);
    }

}
