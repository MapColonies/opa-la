import { MigrationInterface, QueryRunner } from 'typeorm';

export class RequiredKeys1745474706009 implements MigrationInterface {
  name = 'RequiredKeys1745474706009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "auth_manager"."key" ALTER COLUMN "private_key" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "auth_manager"."key" ALTER COLUMN "public_key" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "auth_manager"."key" ALTER COLUMN "public_key" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "auth_manager"."key" ALTER COLUMN "private_key" DROP NOT NULL`);
  }
}
