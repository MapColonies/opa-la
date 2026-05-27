import path from 'node:path';
import { createPostgresContainer, mergeTestConfig, PG_PORT } from 'test-utils';
import { initConnection } from '@map-colonies/drizzle-utils';
import { createDrizzle, runMigrations } from '@src/db/drizzle.js';
import { getConfig, initConfig } from '@src/common/config.js';

export async function setup(): Promise<void> {
  await initConfig(true);
  const config = getConfig().get('db');

  const container = await createPostgresContainer({
    username: config.username,
    database: config.database,
    password: config.password,
  });

  const port = container.getMappedPort(PG_PORT);
  await mergeTestConfig(path.join(__dirname, '../../config'), { 'db.port': port });

  const pool = await initConnection({ ...config, port });
  const drizzle = createDrizzle(pool);
  await runMigrations(drizzle);
  await pool.end();
}

export async function teardown(): Promise<void> {
  await initConfig(true);
  const config = getConfig().get('db');

  const pool = await initConnection(config);
  await pool.query('DROP SCHEMA IF EXISTS token_kiosk CASCADE');
  await pool.end();
}
