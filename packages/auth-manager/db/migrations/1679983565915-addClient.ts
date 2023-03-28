/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class addClient1679983565915 implements MigrationInterface {
  name = 'addClient1679983565915';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "auth_manager"."client" ("name" text NOT NULL, "heb_name" text NOT NULL, "description" text, "branch" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "update_at" TIMESTAMP NOT NULL DEFAULT now(), "tech_point_of_contact" json, "product_point_of_contact" json, "tags" text array, CONSTRAINT "PK_480f88a019346eae487a0cd7f0c" PRIMARY KEY ("name"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "auth_manager"."client"`);
  }
}
