import config from 'config';
import { initConnection } from '../../../src/common/db/connection';
import { DbConfig } from '../../../src/common/interfaces';

export default async (): Promise<void> => {
  const dataSourceOptions = config.get<DbConfig>('db');
  const connection = await initConnection(dataSourceOptions);
  if (dataSourceOptions.schema != undefined) {
    await connection.query(`DROP SCHEMA IF EXISTS ${dataSourceOptions.schema} CASCADE`);
  }
  await connection.destroy();
};
