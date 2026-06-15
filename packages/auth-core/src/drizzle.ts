import type { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { runMigrations as runMigrationsBase } from '@map-colonies/drizzle-utils';
import { relations } from './entities';

export type Drizzle = ReturnType<typeof drizzle<typeof relations>>;

export type DrizzleTx = Parameters<Parameters<Drizzle['transaction']>[0]>[0];

export function createDrizzle(pool: Pool): Drizzle {
  return drizzle({ client: pool, relations });
}

export async function runMigrations(drizzle: NodePgDatabase): Promise<void> {
  await runMigrationsBase(drizzle, 'auth_manager', __dirname);
}
