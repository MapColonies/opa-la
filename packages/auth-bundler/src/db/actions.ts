/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Asset } from '@map-colonies/auth-core';
import { dataSource } from './database';

const avi = dataSource.createQueryBuilder().execute();

export async function getAssets(environment: string) {
  return dataSource.query(`
    SELECT *
      FROM auth_manager.asset 
      WHERE ${environment} = ANY ( environment ) 
		  AND 
		    (name, version) IN (SELECT name, max(version) FROM auth_manager.asset GROUP BY name )
  `);
}

export async function getKey(environment: string) {
  return (
    await dataSource.query(`
    SELECT *
      FROM auth_manager.key 
      WHERE ${environment} = environment
		  AND 
		    version = (SELECT max(version) FROM auth_manager.key WHERE ${environment} = environment )
  `)
  )[0];
}

export async function getConnections(environment: string) {
  return dataSource.query(`
      SELECT name,version,allow_no_browser, allow_no_origin, domains, origins
      FROM auth_manager.connection
      WHERE ${environment} = environment AND enabled = TRUE AND (name, version ) IN (SELECT name, max(version) FROM auth_manager.connection WHERE ${environment} = environment GROUP BY name )
  `);
}
