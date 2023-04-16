/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class addBundle1681050416393 implements MigrationInterface {
  name = 'addBundle1681050416393';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "auth_manager"."bundle" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "hash" text, "environment" "auth_manager"."environment_enum" NOT NULL, "metadata" jsonb, "assets" jsonb, "connections" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "key_version" integer, CONSTRAINT "PK_637e3f87e837d6532109c198dea" PRIMARY KEY ("id"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "auth_manager"."bundle"`);
  }
}
