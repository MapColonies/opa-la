/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class addBundle1681026987678 implements MigrationInterface {
  name = 'addBundle1681026987678';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "auth_manager"."bundle" ("id" SERIAL NOT NULL, "hash" text NOT NULL, "environment" "auth_manager"."environment_enum" NOT NULL, "metadata" jsonb NOT NULL, "assets" jsonb NOT NULL, "connections" jsonb NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "key_version" integer NOT NULL, CONSTRAINT "PK_637e3f87e837d6532109c198dea" PRIMARY KEY ("id"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "auth_manager"."bundle"`);
  }
}
