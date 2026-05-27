import 'reflect-metadata';
import path from 'node:path';
import { initConnection } from '@map-colonies/drizzle-utils';
import { createPostgresContainer, resetAndMigrate, mergeTestConfig, PG_PORT } from 'test-utils';
import { getConfig, initConfig } from '@src/common/config.js';

export async function setup(): Promise<void> {
  await initConfig(true);
  const dataSourceOptions = getConfig().get('db');

  const container = await createPostgresContainer({
    username: dataSourceOptions.username,
    database: dataSourceOptions.database,
    password: dataSourceOptions.password,
  });

  const port = container.getMappedPort(PG_PORT);

  const connection = await initConnection({ ...dataSourceOptions, port });
  await mergeTestConfig(path.join(__dirname, '../../config'), { 'db.port': port });

  await resetAndMigrate(connection);
}
