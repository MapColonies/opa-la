/// <reference types="jest-extended" />

import { assetTable, Environment, createDrizzle, type Drizzle, keyTable, connectionTable, bundleTable, type Asset } from '@map-colonies/auth-core';
import type { Pool } from 'pg';
import { initConnection } from '@map-colonies/drizzle-utils';
import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest';
import { getFakeAsset, getFakeConnection, getMockKeys } from 'test-utils';
import { BundleDatabase } from '@src/db.js';
import * as execa from '@src/wrappers/execa.js';
import { getConfig, initConfig } from './helpers/config.js';

vi.mock('../src/wrappers/execa', async () => {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    ...(await vi.importActual('../src/wrappers/execa')),
  };
});

type ExecaChildProcess = Awaited<ReturnType<(typeof execa)['execa']>>;

describe('db.ts', function () {
  let pool: Pool;
  let drizzle: Drizzle;
  const asset = getFakeAsset(false, { environment: [Environment.PROD], name: 'aviaviavi' });
  const connection = getFakeConnection(false, { environment: Environment.PROD, name: 'xd' });

  beforeAll(async function () {
    await initConfig();
    const connectionOptions = getConfig().getAll();

    pool = await initConnection(connectionOptions);
    drizzle = createDrizzle(pool);

    const [privateKey, publicKey] = getMockKeys();
    await drizzle.insert(keyTable).values({ environment: Environment.PROD, version: 1, privateKey, publicKey });

    await drizzle.insert(assetTable).values([
      { ...asset, version: 1 },
      { ...asset, version: 2 },
    ]);

    await drizzle.insert(connectionTable).values([
      { ...connection, version: 1 },
      { ...connection, version: 2 },
    ]);
  });

  afterAll(async function () {
    await pool.end();
  });

  describe('#saveBundle', function () {
    it('should save the bundle to the db', async function () {
      const VERSION_OUTPUT = 'Version: 0.52.0\nBuild Commit: 8d2c137662560cac83d9cf24cbdaecc934910333\nBuild Timestamp: 2023-04-27T17:57:23Z';
      vi.spyOn(execa, 'execa').mockResolvedValue({ stdout: VERSION_OUTPUT } as ExecaChildProcess);

      const db = new BundleDatabase(pool);

      const res = await db.saveBundle({ assets: [], connections: [], environment: Environment.PROD, keyVersion: 3 }, 'xdxd');

      expect(res).toBeGreaterThan(0);

      // const bundle = await pool.getRepository(Bundle).findOneByOrFail({ id: res });
      const bundle = await drizzle.query.bundle.findFirst({ where: { id: res } });

      expect(bundle).toMatchObject({
        environment: Environment.PROD,
        keyVersion: 3,
        opaVersion: '0.52.0',
        hash: 'xdxd',
        assets: [],
        connections: [],
      });
    });

    describe('#getLatestVersions', function () {
      it('should fetch the latest versions from the database', async function () {
        const db = new BundleDatabase(pool);

        const { assets, connections, keyVersion } = await db.getLatestVersions(Environment.PROD);

        expect(keyVersion).toBe(1);

        const asset = assets.filter((a) => a.name === 'aviaviavi');

        expect(asset).toHaveLength(1);
        expect(asset[0]).toHaveProperty('version', 2);

        const connection = connections.filter((c) => c.name === 'xd');

        expect(connection).toHaveLength(1);
        expect(connection[0]).toHaveProperty('version', 2);
      });

      it('should return the latest version of the asset even if there is a newer version in the database with a different environment', async function () {
        await drizzle.insert(assetTable).values([
          { ...asset, name: 'xd', environment: [Environment.STAGE, Environment.NP], version: 1 },
          { ...asset, name: 'xd', environment: [Environment.STAGE], version: 2 },
        ]);

        const { assets } = await new BundleDatabase(pool).getLatestVersions(Environment.NP);

        expect(assets).toHaveLength(1);
        expect(assets[0]).toMatchObject({ name: 'xd', version: 1 });
      });
    });

    describe('#getBundleFromVersions', function () {
      it('should fetch the bundle content based on the versions from the database', async function () {
        const db = new BundleDatabase(pool);

        const { assets } = await db.getBundleFromVersions({
          environment: Environment.PROD,
          assets: [{ name: 'aviaviavi', version: 1 }],
          connections: [],
          keyVersion: 1,
        });

        expect(assets).toSatisfyAll<Asset>((a) => a.environment.includes(Environment.PROD));
        expect(assets[0]).toHaveProperty('version', 1);
      });
    });
  });

  describe('#getLatestBundleByEnv', function () {
    it('should return null when no bundle exists for the environment', async function () {
      const db = new BundleDatabase(pool);

      const result = await db.getLatestBundleByEnv(Environment.STAGE);

      expect(result).toBeNull();
    });

    it('should return the latest bundle ordered by id for the given environment', async function () {
      await drizzle.insert(bundleTable).values([
        { environment: Environment.STAGE, hash: 'hash1', opaVersion: '0.52.0', assets: [], connections: [] },
        { environment: Environment.STAGE, hash: 'hash2', opaVersion: '0.52.0', assets: [], connections: [] },
      ]);

      const db = new BundleDatabase(pool);
      const result = await db.getLatestBundleByEnv(Environment.STAGE);

      expect(result).not.toBeNull();
      expect(result).toMatchObject({ environment: Environment.STAGE, hash: 'hash2' });
    });

    it('should not return bundles from a different environment', async function () {
      const db = new BundleDatabase(pool);

      const result = await db.getLatestBundleByEnv(Environment.NP);

      expect(result).toBeNull();
    });
  });
});
