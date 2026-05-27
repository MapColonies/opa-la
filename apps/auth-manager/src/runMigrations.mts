import { initConnection } from '@map-colonies/drizzle-utils';
import { createDrizzle, runMigrations } from '@map-colonies/auth-core';
import { getConfig, initConfig } from './common/config.js';

await initConfig();
const config = getConfig();
const pool = await initConnection(config.get('db'));
await runMigrations(createDrizzle(pool));
await pool.end();
console.log('Migrations completed');
