import { initConnection } from '@map-colonies/drizzle-utils';
import { getConfig, initConfig } from './common/config.js';
import { createDrizzle, runMigrations } from './db/drizzle.js';

await initConfig();
const config = getConfig();
const pool = await initConnection(config.get('db'));
await runMigrations(createDrizzle(pool));
await pool.end();
console.log('Migrations completed');
