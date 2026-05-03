import 'reflect-metadata';
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { initConnection } from '@map-colonies/auth-core';
import { createPostgresContainer, resetAndMigrate, mergeTestConfig } from 'test-utils';

import { getConfig, initConfig } from '@src/common/config.js';

export async function setup(): Promise<void> {
  await initConfig(true);
  const dataSourceOptions = getConfig().get('db');

  console.log('time before creating container', new Date().toISOString());
  const container = await createPostgresContainer({
    username: dataSourceOptions.username,
    database: dataSourceOptions.database,
    password: dataSourceOptions.password,
  });

  console.log('time after creating container', new Date().toISOString());
  await mergeTestConfig(path.join(__dirname, '../../config'), { port: container.getPort() });
  console.log('config path:', path.join(__dirname, '../../config'));
  fs.readdirSync(path.join(__dirname, '../../config')).forEach((file) => {
    console.log('config file:', file);
  });
  const res = execSync('docker ps');
  console.log('docker ps output:', res.toString());

  const connection = await initConnection({ ...dataSourceOptions });
  await resetAndMigrate(connection, dataSourceOptions.schema);
}
