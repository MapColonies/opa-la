import { ConnectionConfig } from 'pg';
import type { Config as DrizzleConfig } from 'drizzle-kit';
import { createConnectionOptions } from '@map-colonies/drizzle-utils';
import config from 'config';

import { ConnectionOptions } from 'node:tls';

const dbOptions = createConnectionOptions(config.get('db')) as Omit<Required<ConnectionConfig>, 'password' | 'ssl'> & {
  password: string;
  ssl?: ConnectionOptions;
};

const drizzleConfig: DrizzleConfig = {
  schema: ['./src/users/user.ts'],
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: dbOptions,
};

export default drizzleConfig;
