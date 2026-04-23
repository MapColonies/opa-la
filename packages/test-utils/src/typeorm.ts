import { type DataSource } from 'typeorm';
import type { commonDbFullV1Type } from '@map-colonies/schemas';
import { initConnection } from '@map-colonies/auth-core';

type AdminConnectionOptions = Omit<commonDbFullV1Type, 'database' | 'schema'>;

/**
 * Creates the database (inside an already-running postgres server) if it does not yet exist.
 * Must be called before initConnection with the target database name.
 */
// export async function createDatabase(options: AdminConnectionOptions, databaseName: string): Promise<void> {
//   const adminConnection = await initConnection({ ...options, database: 'postgres', schema: 'public' });

//   // Parameters cannot be used for DDL statements in PostgreSQL
//   const result = await adminConnection.query<[{ count: string }]>(
//     `SELECT COUNT(*) FROM pg_database WHERE datname = '${databaseName}'`
//   );
//   if (result[0].count === '0') {
//     await adminConnection.query(`CREATE DATABASE "${databaseName}"`);
//   }
//   await adminConnection.destroy();
// }

/**
 * Drops the database if it exists.
 */
// export async function dropDatabase(options: AdminConnectionOptions, databaseName: string): Promise<void> {
//   const adminConnection = await initConnection({ ...options, database: 'postgres', schema: 'public' });

//   await adminConnection.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
//   await adminConnection.destroy();
// }

/**
 * Drops and recreates the schema, then runs all pending migrations on the given connection.
 */
export async function resetAndMigrate(connection: DataSource, schema: string): Promise<void> {
  await connection.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await connection.query(`CREATE SCHEMA "${schema}"`);
  await connection.runMigrations();
}

export type { commonDbFullV1Type as TypeormConnectionOptions };
