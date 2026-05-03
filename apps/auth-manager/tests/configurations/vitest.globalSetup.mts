import 'reflect-metadata';
import path from 'node:path';
import fs from 'node:fs';
import { initConnection } from '@map-colonies/auth-core';
import { createPostgresContainer, resetAndMigrate, mergeTestConfig } from 'test-utils';

import { getConfig, initConfig } from '@src/common/config.js';

export async function setup(): Promise<void> {
  await initConfig(true);
  const dataSourceOptions = getConfig().get('db');

  const container = await createPostgresContainer({
    username: dataSourceOptions.username,
    database: dataSourceOptions.database,
    password: dataSourceOptions.password,
  });

  const connection = await initConnection({ ...dataSourceOptions });
  await mergeTestConfig(path.join(__dirname, '../../config'), { port: container.getPort() });
  console.log('config path:', path.join(__dirname, '../../config'));
  fs.readdirSync(path.join(__dirname, '../../config')).forEach((file) => {
    console.log('config file:', file);
  });
  await resetAndMigrate(connection, dataSourceOptions.schema);
}
