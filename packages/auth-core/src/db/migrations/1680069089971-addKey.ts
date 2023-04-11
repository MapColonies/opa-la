/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class addKey1680069089971 implements MigrationInterface {
  name = 'addKey1680069089971';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "auth_manager"."key_environment_enum" AS ENUM('np', 'stage', 'prod')`);
    await queryRunner.query(
      `CREATE TABLE "auth_manager"."key" ("environment" "auth_manager"."key_environment_enum" NOT NULL, "version" integer NOT NULL, "private_key" jsonb, "public_key" jsonb, CONSTRAINT "PK_ddf3d991c46b66651794ee56d58" PRIMARY KEY ("environment", "version"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "auth_manager"."key"`);
    await queryRunner.query(`DROP TYPE "auth_manager"."key_environment_enum"`);
  }
}
