import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRevision1774178837014 implements MigrationInterface {
  public name = 'AddRevision1774178837014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "auth_manager"."bundle" ADD "revision" text`);
    await queryRunner.query(`UPDATE "auth_manager"."bundle" SET "revision" = environment::text || '-' || id::text`);
    await queryRunner.query(`ALTER TABLE "auth_manager"."bundle" ALTER COLUMN "revision" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "auth_manager"."bundle" DROP COLUMN "revision"`);
  }
}
