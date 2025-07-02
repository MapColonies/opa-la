import config from 'config';
import { createConnectionOptions, initConnection, createDrizzle, runMigrations } from './createConnection';

(async (): Promise<void> => {
  const pool = await initConnection(createConnectionOptions(config.get('db')));
  await runMigrations(createDrizzle(pool));
  await pool.end();
  console.log('Migrations completed');
})().catch(console.error);
