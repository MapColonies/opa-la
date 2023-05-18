import { mkdir } from 'fs/promises';
import { existsSync } from 'node:fs';
import path from 'path';
import { tmpdir } from 'os';
// import config from 'config';
import { DbConfig, initConnection } from '@map-colonies/auth-core';

export default async (): Promise<void> => {
  const folder = path.join(tmpdir(), 'authcrontests');
  if (!existsSync(folder)) {
    await mkdir(folder);
  }

  // const dataSourceOptions = config.get<DbConfig>('db');
  // const connection = await initConnection({ ...dataSourceOptions });
  // // it is not allowed to use parameters for create commands in postgresql :(
  // if (dataSourceOptions.schema != undefined) {
  //   await connection.query(`DROP SCHEMA IF EXISTS ${dataSourceOptions.schema} CASCADE`);
  // }
  // await connection.query(`CREATE SCHEMA IF NOT EXISTS ${dataSourceOptions.schema ?? 'public'}`);
  // await connection.runMigrations();
  // await connection.destroy();
};
