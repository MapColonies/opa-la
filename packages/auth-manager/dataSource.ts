import { DataSource } from 'typeorm';
import config from 'config';
import { createConnectionOptions, DbConfig } from '@map-colonies/auth-core';

const connectionOptions = config.get<DbConfig>('db');

export const appDataSource = new DataSource({
  ...createConnectionOptions(connectionOptions),
});
