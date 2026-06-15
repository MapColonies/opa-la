import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import { runMigrations as runMigrationsBase } from '@map-colonies/drizzle-utils';
import { defineRelations } from 'drizzle-orm';

import { usersTable } from '../users/user';

const relations = defineRelations({
  users: usersTable,
});

export type Drizzle = ReturnType<typeof drizzle<typeof relations>>;

export function createDrizzle(pool: Pool): Drizzle {
  return drizzle({ client: pool, relations });
}

// maybe we should test migrations as well. for now, we'll just ignore them
/* istanbul ignore next */
export async function runMigrations(drizzle: Drizzle): Promise<void> {
  await runMigrationsBase(drizzle, 'token_kiosk', __dirname);
}
