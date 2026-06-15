import { ConnectionConfig } from 'pg';
import { defineConfig } from 'drizzle-kit';
import { getConfig, initConfig } from './src/config.js';

import { createConnectionOptions } from '@map-colonies/drizzle-utils';
import { ConnectionOptions } from 'node:tls';

await initConfig();

const config = getConfig().getAll();

const dbOptions = createConnectionOptions(config) as Omit<Required<ConnectionConfig>, 'password' | 'ssl'> & {
  password: string;
  ssl?: ConnectionOptions;
};

export default defineConfig({
  schema: ['./src/entities/index.ts'],
  out: './src/migrations',
  dialect: 'postgresql',
  schemaFilter: ['auth_manager', 'public'],
  dbCredentials: { ...dbOptions, user: dbOptions.user, ssl: false },
  verbose: true,
  migrations: { schema: config.schema },
  strict: false,
});
