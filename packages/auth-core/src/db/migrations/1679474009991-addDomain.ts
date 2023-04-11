/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class addDomain1679474009991 implements MigrationInterface {
  name = 'addDomain1679474009991';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "auth_manager"."domain" ("name" text NOT NULL, CONSTRAINT "PK_26a07113f90df161f919c7d5a65" PRIMARY KEY ("name"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "auth_manager"."domain"`);
  }
}
