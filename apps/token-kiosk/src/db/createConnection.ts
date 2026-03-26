import { hostname } from 'node:os';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { commonDbFullV1Type } from '@map-colonies/schemas';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool, type PoolConfig } from 'pg';
import { HealthCheck } from '@godaddy/terminus';
import { promiseTimeout } from '../common/utils';
import { DB_CONNECTION_TIMEOUT } from '../common/constants';
import { users } from '../users/user';

export type DbConfig = PoolConfig & commonDbFullV1Type;

export function createConnectionOptions(dbConfig: DbConfig): PoolConfig {
  const { ssl, ...dataSourceOptions } = dbConfig;
  dataSourceOptions.application_name = `${hostname()}-${process.env.NODE_ENV ?? 'unknown_env'}`;

  const poolConfig: PoolConfig = {
    ...dataSourceOptions,
    user: dbConfig.username,
  };
  if (ssl.enabled) {
    delete poolConfig.password;
    poolConfig.ssl = { key: readFileSync(ssl.key), cert: readFileSync(ssl.cert), ca: readFileSync(ssl.ca) };
  }
  return poolConfig;
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

export function healthCheck(connection: Pool): HealthCheck {
  return async (): Promise<void> => {
    const check = connection.query('SELECT 1').then(() => {
      return;
    });
    return promiseTimeout<void>(DB_CONNECTION_TIMEOUT, check);
  };
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
