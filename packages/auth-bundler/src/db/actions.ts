/* eslint-disable @typescript-eslint/no-unsafe-return */
import { createHash } from 'node:crypto';
import { Asset, Bundle, Connection, Environment, Key } from '@map-colonies/auth-core';
import { BundleContent, BundleContentVersions } from '../types';
import { dataSource } from './database';

async function getAssetsVersions(environment: string): {name: string, version:number}[] {
  // return dataSource.query(`
  //   SELECT *
  //     FROM auth_manager.asset
  //     WHERE ${environment} = ANY ( environment )
	// 	  AND
	// 	    (name, version) IN (SELECT name, max(version) FROM auth_manager.asset GROUP BY name )
  // `);
}

async function getLatestKeyVersions(environment: string) {
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

async function getConnectionsVersions(environment: string) {
  return dataSource.query(`
      SELECT name,version,allow_no_browser, allow_no_origin, domains, origins
      FROM auth_manager.connection
      WHERE ${environment} = environment AND enabled = TRUE AND (name, version) IN (SELECT name, max(version) FROM auth_manager.connection WHERE ${environment} = environment GROUP BY name )
  `);
}

function extractNameAndVersion<T extends { name: string; version: number }>(entities: T[]): { name: string; version: number }[] {
  return entities.map((a) => ({ name: a.name, version: a.version }));
}

function createBundleHash(versions: BundleContentVersions): string {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(versions));
  return hash.digest('base64');
}

export async function getSpecificBundleVersions(id: number): Promise<BundleContentVersions> {
  const bundle = await dataSource.getRepository(Bundle).findOneBy({ id });
  if (bundle === null) {
    throw new Error();
  }

  return {
    assets: bundle.assets ?? [],
    connections: bundle.connections ?? [],
    environment: bundle.environment,
    key: bundle.keyVersion ?? 0,
  };
}

export async function getLatestVersions(env: Environment): Promise<BundleContentVersions> {
  await Promise.resolve();
  throw new Error();
}

export async function saveBundle(versions: BundleContentVersions): Promise<number> {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(versions));
  const bundle: Omit<Bundle, 'id'> = {
    environment: versions.environment,
    assets: versions.assets,
    connections: versions.connections,
    keyVersion: versions.key,
    hash: createBundleHash(versions),
  };

  const res = await dataSource.getRepository(Bundle).save(bundle);
  return res.id;
}

export async function getBundleFromVersions(versions: BundleContentVersions): Promise<BundleContent> {
  await dataSource.initialize();
  const assets = dataSource
    .getRepository(Asset)
    .createQueryBuilder()
    .whereInIds(extractNameAndVersion(versions.assets))
    .andWhere(':env = ANY(environment)', { env: versions.environment })
    .getMany();

  console.log(await assets);

  const connections = dataSource
    .getRepository(Connection)
    .createQueryBuilder()
    .whereInIds(extractNameAndVersion(versions.connections))
    .andWhere(':env = environment', { env: versions.environment })
    .getMany();

  const key =
    versions.key !== 0 ? dataSource.getRepository(Key).findOneByOrFail({ environment: versions.environment, version: versions.key }) : undefined;

  const promises = await Promise.all([assets, connections, key]);

  return { assets: promises[0], connections: promises[1], key: promises[2], environment: versions.environment };
}
