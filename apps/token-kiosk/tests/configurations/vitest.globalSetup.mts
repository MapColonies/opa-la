import path from 'node:path';
import { createPostgresContainer, mergeTestConfig } from 'test-utils';
import { initConnection, createConnectionOptions, createDrizzle, runMigrations } from '@src/db/createConnection.js';
import { getConfig, initConfig } from '@src/common/config.js';

export async function setup(): Promise<void> {
  await initConfig(true);
  const config = getConfig().get('db');

  const container = await createPostgresContainer({
    username: config.username,
    database: config.database,
    password: config.password,
  });

  await mergeTestConfig(path.join(__dirname, '../../config'), { 'db.port': container.getPort() });

  const pool = await initConnection(createConnectionOptions({ ...config, port: container.getPort() }));
  const drizzle = createDrizzle(pool);
  await runMigrations(drizzle);
  await pool.end();
}

export async function teardown(): Promise<void> {
  await initConfig(true);
  const config = getConfig().get('db');

  const pool = await initConnection(createConnectionOptions(config));
  await pool.query('DROP SCHEMA IF EXISTS token_kiosk CASCADE');
  await pool.end();
}
