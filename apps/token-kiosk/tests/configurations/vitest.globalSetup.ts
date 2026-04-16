import config from 'config';
import { initConnection, createConnectionOptions, createDrizzle, runMigrations } from '@src/db/createConnection';

export async function setup(): Promise<void> {
  const pool = await initConnection(createConnectionOptions(config.get('db')));
  const drizzle = createDrizzle(pool);
  await runMigrations(drizzle);
  await pool.end();
}

export async function teardown(): Promise<void> {
  const pool = await initConnection(createConnectionOptions(config.get('db')));
  await pool.query('DROP SCHEMA IF EXISTS token_kiosk CASCADE');
  await pool.end();
}
