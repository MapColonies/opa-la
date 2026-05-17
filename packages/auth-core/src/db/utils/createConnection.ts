import { hostname } from 'node:os';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { Pool, type PoolConfig } from 'pg';
import type { commonDbFullV1Type } from '@map-colonies/schemas';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { relations } from '../entities';

export function createConnectionOptions(dbOptions: commonDbFullV1Type): PoolConfig {
  const { ssl, ...rest } = dbOptions;
  const dbConfig: PoolConfig = structuredClone(rest);
  dbConfig.application_name = `${hostname()}-${process.env.NODE_ENV ?? 'unknown_env'}`;
  dbConfig.user = dbOptions.username;
  if (ssl.enabled) {
    dbConfig.password = undefined;
    dbConfig.ssl = { key: readFileSync(ssl.key), cert: readFileSync(ssl.cert), ca: readFileSync(ssl.ca) };
  }

  return dbConfig;
}

export async function initConnection(dbConfig: commonDbFullV1Type): Promise<Pool> {
  const pool = new Pool(createConnectionOptions(dbConfig));
  await pool.query('SELECT NOW()');
  return pool;
}

export type Drizzle = ReturnType<typeof drizzle<typeof relations>>;

export function createDrizzle(pool: Pool): Drizzle {
  return drizzle({ client: pool, relations });
}

export async function runMigrations(drizzle: NodePgDatabase): Promise<void> {
  const optionalFolders = ['./db/migrations', './src/db/migrations', './migrations'].map((folder) => path.join(__dirname, '..', '..', '..', folder));
  let migrationsFolder = null;

  for (const folder of optionalFolders) {
    if (!existsSync(folder)) {
      continue;
    }
    const folderContent = readdirSync(folder, { withFileTypes: true });

    const hasMigrations = folderContent.some((item) => item.isDirectory() && existsSync(path.join(folder, item.name, 'migration.sql')));
    if (hasMigrations) {
      migrationsFolder = folder;
      break;
    }
  }

  if (migrationsFolder === null) {
    throw new Error('No migrations folder found');
  }

  await migrate(drizzle, { migrationsFolder: migrationsFolder, migrationsSchema: 'auth_manager' });
}
