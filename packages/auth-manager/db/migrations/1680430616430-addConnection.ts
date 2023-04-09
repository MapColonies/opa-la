/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class addConnection1680430616430 implements MigrationInterface {
  name = 'addConnection1680430616430';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "auth_manager"."connection" ("name" character varying NOT NULL, "version" integer NOT NULL, "environment" "auth_manager"."environment_enum" NOT NULL, "enabled" boolean NOT NULL, "token" text NOT NULL, "allow_no_browser" boolean NOT NULL, "allow_no_origin" boolean NOT NULL, "domains" text array NOT NULL, "origins" text array NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4c3be048a366c9ce9277bac4c38" PRIMARY KEY ("name", "version", "environment"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "auth_manager"."connection"`);
  }
}
