import { rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { initConnection } from '@map-colonies/auth-core';
import { getConfig, initConfig } from '../helpers/config';

export default async (): Promise<void> => {
  await initConfig();
  const configInstance = getConfig();
  const dataSourceOptions = configInstance.getAll();

  await rm(path.join(tmpdir(), 'authbundlertests'), { force: true, recursive: true });

  const connection = await initConnection(dataSourceOptions);
  await connection.query(`DROP SCHEMA IF EXISTS ${dataSourceOptions.schema} CASCADE`);
  await connection.destroy();
};
