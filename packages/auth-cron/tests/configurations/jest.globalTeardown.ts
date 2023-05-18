import { rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import config from 'config';
import { DbConfig, initConnection } from '@map-colonies/auth-core';

export default async (): Promise<void> => {
  await rm(path.join(tmpdir(), 'authcrontests'), { force: true, recursive: true });

  const dataSourceOptions = config.get<DbConfig>('db');
  const connection = await initConnection(dataSourceOptions);
  if (dataSourceOptions.schema != undefined) {
    await connection.query(`DROP SCHEMA IF EXISTS ${dataSourceOptions.schema} CASCADE`);
  }
  await connection.destroy();
};
