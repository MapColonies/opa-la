import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { commonDbFullV1Type } from '@map-colonies/schemas';
/**
 * An object describing all the necessary configuration to authenticate to a postgresql database.
 * It is an extension of the {@link https://typeorm.io/data-source-options#postgres--cockroachdb-data-source-options | PostgresConnectionOptions}
 * @property ssl include if Should database connection be authenticated using SSL certificates and if true so provide the paths for the SSL certificates and key.
 */
export type DbConfig = Pick<commonDbFullV1Type, 'ssl'> & PostgresConnectionOptions;
