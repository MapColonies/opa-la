import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

/**
 * An object describing all the necessary configuration to authenticate to a postgresql database.
 * It is an extension of the {@link https://typeorm.io/data-source-options#postgres--cockroachdb-data-source-options | PostgresConnectionOptions}
 * @property enableSslAuth Should database connection be authenticated using SSL certificates.
 * @property sslPaths The paths for the SSL certificates and key.
 */
export type DbConfig = {
  enableSslAuth: boolean;
  sslPaths: { ca: string; cert: string; key: string };
} & PostgresConnectionOptions;
