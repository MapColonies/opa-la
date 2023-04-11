import { DataSource } from 'typeorm';
import config from 'config';
import { createConnectionOptions, DbConfig } from 'auth-core';

const connectionOptions = config.get<DbConfig>('db');

export const appDataSource = new DataSource({
  ...createConnectionOptions(connectionOptions),
});
