import 'reflect-metadata';
import { initConnection } from '@map-colonies/auth-core';
import { getConfig, initConfig } from '@src/common/config';

export async function setup(): Promise<void> {
  await initConfig(true);
  const configInstance = getConfig();
  const dataSourceOptions = configInstance.get('db');
  const connection = await initConnection({ ...dataSourceOptions });
  await connection.query(`DROP SCHEMA IF EXISTS ${dataSourceOptions.schema} CASCADE`);
  await connection.query(`CREATE SCHEMA IF NOT EXISTS ${dataSourceOptions.schema}`);
  await connection.runMigrations();
  await connection.destroy();
}

export async function teardown(): Promise<void> {
  await initConfig(true);
  const configInstance = getConfig();
  const dataSourceOptions = configInstance.get('db');
  const connection = await initConnection(dataSourceOptions);
  await connection.query(`DROP SCHEMA IF EXISTS ${dataSourceOptions.schema} CASCADE`);
  await connection.destroy();
}
