import { hostname } from 'node:os';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool, type PoolConfig } from 'pg';
import { users } from '../users/user';

export type DbConfig = {
  enableSslAuth: boolean;
  sslPaths: { ca: string; cert: string; key: string };
} & PoolConfig;

export function createConnectionOptions(dbConfig: DbConfig): PoolConfig {
  const { enableSslAuth, sslPaths, ...dataSourceOptions } = dbConfig;
  dataSourceOptions.application_name = `${hostname()}-${process.env.NODE_ENV ?? 'unknown_env'}`;
  if (enableSslAuth) {
    dataSourceOptions.password = undefined;
    dataSourceOptions.ssl = { key: readFileSync(sslPaths.key), cert: readFileSync(sslPaths.cert), ca: readFileSync(sslPaths.ca) };
  }
  return {
    ...dataSourceOptions,
  };
}

export async function initConnection(dbConfig: PoolConfig): Promise<Pool> {
  const pool = new Pool(dbConfig);
  await pool.query('SELECT NOW()');
  return pool;
}

export type Drizzle = ReturnType<typeof createDrizzle>;

export function createDrizzle(pool: Pool): ReturnType<typeof drizzle<{ users: typeof users }>> {
  return drizzle(pool, {
    schema: {
      users,
    },
  });
}

// maybe we should test migrations as well. for now, we'll just ignore them
/* istanbul ignore next */
export async function runMigrations(drizzle: Drizzle): Promise<void> {
  const optionalFolders = ['./src/db/migrations', './db/migrations', './migrations'];
  let migrationsFolder: string | null = null;

  for (const folder of optionalFolders) {
    if (existsSync(join(folder, '/meta/_journal.json'))) {
      migrationsFolder = folder;
      break;
    }
  }

  if (migrationsFolder === null) {
    throw new Error('No migrations folder found');
  }

  await migrate(drizzle, { migrationsFolder: migrationsFolder, migrationsSchema: 'token_kiosk' });
}
