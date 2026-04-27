import { type DataSource } from 'typeorm';
import type { commonDbFullV1Type } from '@map-colonies/schemas';

/**
 * Drops and recreates the schema, then runs all pending migrations on the given connection.
 */
export async function resetAndMigrate(connection: DataSource, schema: string): Promise<void> {
  await connection.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await connection.query(`CREATE SCHEMA "${schema}"`);
  await connection.runMigrations();
}

export type { commonDbFullV1Type as TypeormConnectionOptions };
