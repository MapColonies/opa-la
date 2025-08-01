/// <reference types="jest-extended" />

import { Asset, Bundle, Connection, Environment, Key, createConnectionOptions } from '@map-colonies/auth-core';
import { DataSource } from 'typeorm';
import { ConnectionNotInitializedError } from '@src';
import { BundleDatabase } from '@src/db';
import * as execa from '@src/wrappers/execa';
import { getMockKeys } from './utils/key';
import { getFakeAsset } from './utils/asset';
import { getFakeConnection } from './utils/connection';
import { getConfig, initConfig } from './helpers/config';

jest.mock('../src/wrappers/execa', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    ...jest.requireActual('../src/wrappers/execa'),
  };
});

type ExecaChildProcess = Awaited<ReturnType<(typeof execa)['execa']>>;

describe('db.ts', function () {
  let dataSource: DataSource;
  const asset = { ...getFakeAsset(), environment: [Environment.PRODUCTION], name: 'aviaviavi' };
  const connection: Connection = { ...getFakeConnection(), environment: Environment.PRODUCTION, name: 'xd' };

  beforeAll(async function () {
    await initConfig();
    const connectionOptions = getConfig().getAll();

    dataSource = new DataSource({
      ...createConnectionOptions(connectionOptions),
    });

    await dataSource.initialize();

    const [privateKey, publicKey] = getMockKeys();
    await dataSource.getRepository(Key).save({ environment: Environment.PRODUCTION, version: 1, privateKey, publicKey });

    await dataSource.getRepository(Asset).save([
      { ...asset, version: 1 },
      { ...asset, version: 2 },
    ]);

    await dataSource.getRepository(Connection).save([
      { ...connection, version: 1 },
      { ...connection, version: 2 },
    ]);
  });

  afterAll(async function () {
    await dataSource.destroy();
  });

  describe('#init', function () {
    it('should throw an error if datasource is not initialized', function () {
      const connectionOptions = getConfig().getAll();
      const dataSource = new DataSource({
        ...createConnectionOptions(connectionOptions),
      });

      expect(() => {
        new BundleDatabase(dataSource);
      }).toThrow(ConnectionNotInitializedError);
    });
  });

  describe('#saveBundle', function () {
    it('should save the bundle to the db', async function () {
      const VERSION_OUTPUT = 'Version: 0.52.0\nBuild Commit: 8d2c137662560cac83d9cf24cbdaecc934910333\nBuild Timestamp: 2023-04-27T17:57:23Z';
      jest.spyOn(execa, 'execa').mockResolvedValue({ stdout: VERSION_OUTPUT } as ExecaChildProcess);

      const db = new BundleDatabase(dataSource);

      const res = await db.saveBundle({ assets: [], connections: [], environment: Environment.PRODUCTION, keyVersion: 3 }, 'xdxd');

      expect(res).toBeGreaterThan(0);
      const bundle = await dataSource.getRepository(Bundle).findOneByOrFail({ id: res });

      expect(bundle).toMatchObject({
        environment: Environment.PRODUCTION,
        keyVersion: 3,
        opaVersion: '0.52.0',
        hash: 'xdxd',
        assets: [],
        connections: [],
      });
    });

    describe('#getLatestVersions', function () {
      it('should fetch the latest versions from the database', async function () {
        const db = new BundleDatabase(dataSource);

        const { assets, connections, keyVersion } = await db.getLatestVersions(Environment.PRODUCTION);

        expect(keyVersion).toBe(1);

        const asset = assets.filter((a) => a.name === 'aviaviavi');
        expect(asset).toHaveLength(1);
        expect(asset[0]).toHaveProperty('version', 2);

        const connection = connections.filter((c) => c.name === 'xd');
        expect(connection).toHaveLength(1);
        expect(connection[0]).toHaveProperty('version', 2);
      });

      it('should return the latest version of the asset even if there is a newer version in the database with a different environment', async function () {
        await dataSource.getRepository(Asset).save([
          { ...asset, name: 'xd', environment: [Environment.STAGE, Environment.NP], version: 1 },
          { ...asset, name: 'xd', environment: [Environment.STAGE], version: 2 },
        ]);

        const { assets } = await new BundleDatabase(dataSource).getLatestVersions(Environment.NP);

        expect(assets).toHaveLength(1);
        expect(assets[0]).toMatchObject({ name: 'xd', version: 1 });
      });
    });

    describe('#getBundleFromVersions', function () {
      it('should fetch the bundle content based on the versions from the database', async function () {
        const db = new BundleDatabase(dataSource);

        const { assets } = await db.getBundleFromVersions({
          environment: Environment.PRODUCTION,
          assets: [{ name: 'aviaviavi', version: 1 }],
          connections: [],
          keyVersion: 1,
        });

        expect(assets).toSatisfyAll<Asset>((a) => a.environment.includes(Environment.PRODUCTION));
        expect(assets[0]).toHaveProperty('version', 1);
      });
    });
  });
});
