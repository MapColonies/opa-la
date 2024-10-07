import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

/**
 * An object describing all the necessary configuration to authenticate to a postgresql database.
 * It is an extension of the {@link https://typeorm.io/data-source-options#postgres--cockroachdb-data-source-options | PostgresConnectionOptions}
 * @property ssl include if Should database connection be authenticated using SSL certificates and if true so provide the paths for the SSL certificates and key.
 */
export type DbConfig = {
  ssl:
    | {
        [x: string]: unknown;
        ca: string;
        cert: string;
        key: string;
        enabled: true;
      }
    | {
        [x: string]: unknown;
        ca?: string | undefined;
        cert?: string | undefined;
        key?: string | undefined;
        enabled: false;
      };
} & PostgresConnectionOptions;
