import { hostname } from 'os';
import { readFileSync } from 'fs';
import { DataSource, DataSourceOptions } from 'typeorm';
import { DbConfig } from '../types/interfaces';
import { migrations } from '../migrations';
import { Asset, Bundle, Client, Connection, Domain, Key } from '../entities';

/**
 * A helper function that creates the typeorm DataSource options to use for creating a new DataSource.
 * Handles SSL and registration of all required entities and migrations.
 * @param dbConfig The typeorm postgres configuration with added SSL options.
 * @returns Options object ready to use with typeorm.
 */
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
    type: 'postgres',
  };
};

/**
 * Helper function to handle both the configuration and initialization of a typeORM datasource.
 * Uses {@link createConnectionOptions} to handle the configuration.
 * @param dbConfig The typeorm postgres configuration with added SSL options.
 * @returns Ready to use typeorm DataSource.
 */
export const initConnection = async (dbConfig: DbConfig): Promise<DataSource> => {
  const dataSource = new DataSource(createConnectionOptions(dbConfig));
  await dataSource.initialize();
  return dataSource;
};
