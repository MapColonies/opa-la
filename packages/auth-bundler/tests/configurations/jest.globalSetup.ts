import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { initConnection } from '@map-colonies/auth-core';
import { getConfig, initConfig } from '../helpers/config';

export default async (): Promise<void> => {
  const folder = path.join(tmpdir(), 'authbundlertests');
  if (!existsSync(folder)) {
    await mkdir(folder);
  }

  try {
    await initConfig();
  } catch (error) {
    console.error(error);
  }
  const configInstance = getConfig();
  const dataSourceOptions = configInstance.getAll();
  const connection = await initConnection({ ...dataSourceOptions });

  // it is not allowed to use parameters for create commands in postgresql :(
  await connection.query(`DROP SCHEMA IF EXISTS ${dataSourceOptions.schema} CASCADE`);
  await connection.query(`CREATE SCHEMA IF NOT EXISTS ${dataSourceOptions.schema}`);
  await connection.runMigrations();
  await connection.destroy();
};
