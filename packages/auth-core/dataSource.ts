import { DataSource } from 'typeorm';
import config from 'config';
import { DbConfig } from './src/db/types';
import { migrations } from './src/db/migrations';
import { createConnectionOptions } from './src/db/utils/createConnection';

const connectionOptions = config.get<DbConfig>('db');

export const appDataSource = new DataSource({
  ...createConnectionOptions(connectionOptions),
  // entities: ['src/**/models/*.ts'],
  // migrationsTableName: 'custom_migration_table',
  // migrations,
});
