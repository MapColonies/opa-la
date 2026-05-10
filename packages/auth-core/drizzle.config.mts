import { ConnectionConfig } from 'pg';
import { defineConfig } from 'drizzle-kit';
import { getConfig, initConfig } from './src/config.js';

import { createConnectionOptions } from './src/db/createConnection';
import { ConnectionOptions } from 'node:tls';

await initConfig();

const dbOptions = createConnectionOptions(getConfig().get('db')) as Omit<Required<ConnectionConfig>, 'password' | 'ssl'> & {
  password: string;
  ssl?: ConnectionOptions;
};

export default defineConfig({
  schema: ['./src/users/user.ts'],
  out: './src/db/migrations-drizzle',
  dialect: 'postgresql',
  dbCredentials: dbOptions,
  verbose: true,
  strict: true,
});
