import { runMigrations, authManagerSchema, createDrizzle } from '@map-colonies/auth-core';
import type { Pool } from 'pg';
import type { commonDbFullV1Type } from '@map-colonies/schemas';

/**
 * Drops and recreates the schema, then runs all pending migrations on the given connection.
 */
export async function resetAndMigrate(connection: Pool): Promise<void> {
  await connection.query(`DROP SCHEMA IF EXISTS "${authManagerSchema.schemaName}" CASCADE`);

  const db = createDrizzle(connection);
  await runMigrations(db);
}

export type { commonDbFullV1Type as TypeormConnectionOptions };
