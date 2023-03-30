/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class addAsset1680156507067 implements MigrationInterface {
  name = 'addAsset1680156507067';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "auth_manager"."asset_type_enum" AS ENUM('TEST', 'TEST_DATA', 'POLICY', 'DATA')`);
    await queryRunner.query(`ALTER TYPE "auth_manager"."key_environment_enum" RENAME TO "environment_enum"`);
    await queryRunner.query(
      `CREATE TABLE "auth_manager"."asset" ("name" character varying NOT NULL, "version" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "value" bytea NOT NULL, "uri" character varying NOT NULL, "type" "auth_manager"."asset_type_enum" NOT NULL, "environment" "auth_manager"."environment_enum" array NOT NULL, "isTemplate" boolean NOT NULL, CONSTRAINT "UQ_9d7a80b3f1382d66d3f6ad56d96" UNIQUE ("environment"), CONSTRAINT "PK_c3670311f777dc6ab9965408f97" PRIMARY KEY ("name", "version"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "auth_manager"."asset"`);
    await queryRunner.query(`ALTER TYPE "auth_manager"."environment_enum" RENAME "auth_manager"."key_environment_enum""`);
    await queryRunner.query(`DROP TYPE "auth_manager"."asset_type_enum"`);
  }
}
