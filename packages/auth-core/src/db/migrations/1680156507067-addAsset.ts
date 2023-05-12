/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class addAsset1680156507067 implements MigrationInterface {
  name = 'addAsset1680156507067';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."asset_type_enum" AS ENUM('TEST', 'TEST_DATA', 'POLICY', 'DATA')`);
    await queryRunner.query(`ALTER TYPE "public"."key_environment_enum" RENAME TO "environment_enum"`);
    await queryRunner.query(
      `CREATE TABLE "public"."asset" ("name" character varying NOT NULL, "version" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "value" bytea NOT NULL, "uri" character varying NOT NULL, "type" "public"."asset_type_enum" NOT NULL, "environment" "public"."environment_enum" array NOT NULL, "is_template" boolean NOT NULL, CONSTRAINT "PK_c3670311f777dc6ab9965408f97" PRIMARY KEY ("name", "version"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "public"."asset"`);
    await queryRunner.query(`ALTER TYPE "public"."environment_enum" RENAME TO "key_environment_enum"`);
    await queryRunner.query(`DROP TYPE "public"."asset_type_enum"`);
  }
}
