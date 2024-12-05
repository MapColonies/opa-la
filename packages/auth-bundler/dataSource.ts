import { DataSource } from 'typeorm';
import config from 'config';
import { createConnectionOptions } from '@map-colonies/auth-core';
import { commonDbFullV1Type } from '@map-colonies/schemas';

const connectionOptions = config.util.toObject() as commonDbFullV1Type;

export const appDataSource = new DataSource({
  ...createConnectionOptions(connectionOptions),
});
