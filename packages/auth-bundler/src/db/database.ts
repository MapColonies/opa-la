import config from 'config';
import { createConnectionOptions, DbConfig } from '@map-colonies/auth-core';
import { DataSource, DataSourceOptions } from 'typeorm';

const connectionOptions = config.get<DbConfig>('db');

const avi: DataSourceOptions = {
  ...createConnectionOptions(connectionOptions),
}

export const dataSource = new DataSource(avi);
