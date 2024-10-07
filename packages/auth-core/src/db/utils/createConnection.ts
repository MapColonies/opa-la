import { hostname } from 'os';
import { readFileSync } from 'fs';
import { DataSource, DataSourceOptions } from 'typeorm';
import type { commonDbFullV1Type } from '@map-colonies/schemas';
import { migrations } from '../migrations';
import { Asset, Bundle, Client, Connection, Domain, Key } from '../entities';
import { TlsOptions } from 'tls';

/**
 * A helper function that creates the typeorm DataSource options to use for creating a new DataSource.
 * Handles SSL and registration of all required entities and migrations.
 * @param dbConfig The typeorm postgres configuration with added SSL options.
 * @returns Options object ready to use with typeorm.
 */
export const createConnectionOptions = (dbConfig: commonDbFullV1Type): DataSourceOptions => {
  let ssl: TlsOptions | undefined = undefined;

  const { ssl: InputSsl, ...dataSourceOptions } = dbConfig;

  if (InputSsl.enabled) {
    ssl = { key: readFileSync(InputSsl.key), cert: readFileSync(InputSsl.cert), ca: readFileSync(InputSsl.ca) };
  }

  return {
    type: 'postgres',
    entities: [Asset, Bundle, Client, Connection, Domain, Key],
    migrations,
    migrationsTableName: 'custom_migration_table',
    applicationName: `${hostname()}-${process.env.NODE_ENV ?? 'unknown_env'}`,
    ssl,
    ...dataSourceOptions,
  };
};

/**
 * Helper function to handle both the configuration and initialization of a typeORM datasource.
 * Uses {@link createConnectionOptions} to handle the configuration.
 * @param dbConfig The typeorm postgres configuration with added SSL options.
 * @returns Ready to use typeorm DataSource.
 */
export const initConnection = async (dbConfig: commonDbFullV1Type): Promise<DataSource> => {
  const dataSource = new DataSource(createConnectionOptions(dbConfig));
  await dataSource.initialize();
  return dataSource;
};
