import { hostname } from 'os';
import { readFileSync } from 'fs';
import { DataSource, DataSourceOptions } from 'typeorm';
import { DbConfig } from '../types/interfaces';
import { migrations } from '../migrations';
import { Asset, Bundle, Client, Connection, Domain, Key } from '../entities';

export const createConnectionOptions = (dbConfig: DbConfig): DataSourceOptions => {
  const { enableSslAuth, sslPaths, ...dataSourceOptions } = dbConfig;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  dataSourceOptions.extra = { application_name: `${hostname()}-${process.env.NODE_ENV ?? 'unknown_env'}` };
  if (enableSslAuth) {
    dataSourceOptions.password = undefined;
    dataSourceOptions.ssl = { key: readFileSync(sslPaths.key), cert: readFileSync(sslPaths.cert), ca: readFileSync(sslPaths.ca) };
  }
  return {
    entities: [Asset, Bundle, Client, Connection, Domain, Key],
    migrations,
    migrationsTableName: 'custom_migration_table',
    ...dataSourceOptions,
  };
};

export const initConnection = async (dbConfig: DbConfig): Promise<DataSource> => {
  const dataSource = new DataSource(createConnectionOptions(dbConfig));
  await dataSource.initialize();
  return dataSource;
};
