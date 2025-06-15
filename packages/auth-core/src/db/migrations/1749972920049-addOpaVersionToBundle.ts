import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOpaVersionToBundle1749972920049 implements MigrationInterface {
  name = 'AddOpaVersionToBundle1749972920049';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the column as nullable first
    await queryRunner.query(`ALTER TABLE "auth_manager"."bundle" ADD "opa_version" text`);
    // Set default value for existing bundles
    await queryRunner.query(`UPDATE "auth_manager"."bundle" SET "opa_version" = '0.52.0' WHERE "opa_version" IS NULL`);
    // Make the column NOT NULL
    await queryRunner.query(`ALTER TABLE "auth_manager"."bundle" ALTER COLUMN "opa_version" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "auth_manager"."bundle" DROP COLUMN "opa_version"`);
  }
}
