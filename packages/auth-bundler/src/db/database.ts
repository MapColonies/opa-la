import config from 'config';
import { createConnectionOptions, DbConfig } from '@map-colonies/auth-core';
import { DataSource } from 'typeorm';

const connectionOptions = config.get<DbConfig>('db');

export const dataSource = new DataSource({
  ...createConnectionOptions(connectionOptions),
});
