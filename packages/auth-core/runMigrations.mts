import { initConnection } from '@map-colonies/drizzle-utils';
import { config } from '@map-colonies/config';
import schemas from '@map-colonies/schemas';
import { createDrizzle, runMigrations } from './dist/drizzle.js';

const { commonDbFullV2 } = schemas;

(async () => {
  const configInstance = await config({
    schema: commonDbFullV2,
    offlineMode: true,
  });

  const pool = await initConnection(configInstance.getAll());
  await runMigrations(createDrizzle(pool));
  await pool.end();
  console.log('Migrations completed');
})().catch((err) => {
  console.error('Failed to run migrations', err);
  process.exit(1);
});
