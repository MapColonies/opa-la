import config from 'config';
import createConnectionPool, { sql, ClientConfig } from '@databases/pg';
import tables from '@databases/pg-typed';

type DbConfig = {
  enableSslAuth: boolean;
  sslPaths: { ca: string; cert: string; key: string };
} & ClientConfig;

const dbConfig = config.get<DbConfig>('db');

const db = createConnectionPool({ ...dbConfig, bigIntMode: 'bigint' });

process.once('SIGTERM', () => {
  db.dispose().catch((ex) => {
    console.error(ex);
  });
});

export { sql };
export default db;
