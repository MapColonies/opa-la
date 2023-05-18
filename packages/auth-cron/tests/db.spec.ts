// /// <reference types="jest-extended" />

// import config from 'config';
// import { Asset, Connection, DbConfig, Environment, Key, createConnectionOptions } from '@map-colonies/auth-core';
// import { DataSource } from 'typeorm';
// import { BundleDatabase } from '../src/db';
// import { ConnectionNotInitializedError } from '../src';
// import { getMockKeys } from './utils/key';
// import { getFakeAsset } from './utils/asset';
// import { getFakeConnection } from './utils/connection';

describe.skip('db.ts', function () {
  //   let dataSource: DataSource;
  //   const asset = { ...getFakeAsset(), environment: [Environment.PRODUCTION], name: 'aviaviavi' };
  //   const connection: Connection = { ...getFakeConnection(), environment: Environment.PRODUCTION, name: 'xd' };
  //   beforeAll(async function () {
  //     const connectionOptions = config.get<DbConfig>('db');
  //     dataSource = new DataSource({
  //       ...createConnectionOptions(connectionOptions),
  //     });
  //     await dataSource.initialize();
  //     const [privateKey, publicKey] = getMockKeys();
  //     await dataSource.getRepository(Key).save({ environment: Environment.PRODUCTION, version: 1, privateKey, publicKey });
  //     await dataSource.getRepository(Asset).save([
  //       { ...asset, version: 1 },
  //       { ...asset, version: 2 },
  //     ]);
  //     await dataSource.getRepository(Connection).save([
  //       { ...connection, version: 1 },
  //       { ...connection, version: 2 },
  //     ]);
  //   });
  //   afterAll(async function () {
  //     await dataSource.destroy();
  //   });
  //   describe('#init', function () {
  //     it('should throw an error if datasource is not initialized', function () {
  //       const connectionOptions = config.get<DbConfig>('db');
  //       const dataSource = new DataSource({
  //         ...createConnectionOptions(connectionOptions),
  //       });
  //       expect(() => {
  //         new BundleDatabase(dataSource);
  //       }).toThrow(ConnectionNotInitializedError);
  //     });
  //   });
  //   describe('#saveBundle', function () {
  //     it('should save the bundle to the db', async function () {
  //       const db = new BundleDatabase(dataSource);
  //       const res = await db.saveBundle({ assets: [], connections: [], environment: Environment.PRODUCTION, keyVersion: 3 }, 'xdxd');
  //       expect(res).toBeGreaterThan(0);
  //     });
  //   });
  //   describe('#getLatestVersions', function () {
  //     it('should fetch the latest versions from the database', async function () {
  //       const db = new BundleDatabase(dataSource);
  //       const { assets, connections, keyVersion } = await db.getLatestVersions(Environment.PRODUCTION);
  //       expect(keyVersion).toBe(1);
  //       const asset = assets.filter((a) => a.name === 'aviaviavi');
  //       expect(asset).toHaveLength(1);
  //       expect(asset[0]).toHaveProperty('version', 2);
  //       const connection = connections.filter((c) => c.name === 'xd');
  //       expect(connection).toHaveLength(1);
  //       expect(connection[0]).toHaveProperty('version', 2);
  //     });
  //   });
  //   describe('#getBundleFromVersions', function () {
  //     it('should fetch the bundle content based on the versions from the database', async function () {
  //       const db = new BundleDatabase(dataSource);
  //       const { assets } = await db.getBundleFromVersions({
  //         environment: Environment.PRODUCTION,
  //         assets: [{ name: 'aviaviavi', version: 1 }],
  //         connections: [],
  //         keyVersion: 1,
  //       });
  //       expect(assets).toSatisfyAll<Asset>((a) => a.environment.includes(Environment.PRODUCTION));
  //       expect(assets[0]).toHaveProperty('version', 1);
  //     });
  //   });
});
