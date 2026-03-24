import { tmpdir } from 'node:os';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BundleDatabase, createBundle, computeRevision } from '@map-colonies/auth-bundler';
import * as authBundler from '@map-colonies/auth-bundler';
import { Bundle, Environment } from '@map-colonies/auth-core';
import { Repository } from 'typeorm';
import jsLogger from '@map-colonies/js-logger';
import { infraOpalaCronV1Type } from '@map-colonies/schemas';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getJob } from '@src/job';
import { getConfig, initConfig } from '@src/config';

jest.mock('@map-colonies/auth-bundler');
jest.mock('../src/telemetry/logger', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    logger: jsLogger({ enabled: false }),
  };
});

describe('job.ts', function () {
  describe('#getJob', function () {
    const bundleRepoMock = jest.mocked({ findOne: jest.fn() } as unknown as Repository<Bundle>);
    const bundleDbMock = jest.mocked({
      getLatestVersions: jest.fn(),
      getBundleFromVersions: jest.fn(),
      saveBundle: jest.fn(),
    } as unknown as BundleDatabase);
    const createBundleMock = jest.mocked(createBundle);
    const computeRevisionMock = jest.mocked(computeRevision);
    let s3client: S3Client;
    let cronOptions: Exclude<infraOpalaCronV1Type['cron']['np'], undefined>;
    let getVersionCommandSpy: jest.SpyInstance<Promise<string>, []>;

    beforeAll(async function () {
      await initConfig();
      cronOptions = getConfig().get('cron.np') as Exclude<infraOpalaCronV1Type['cron']['np'], undefined>;
      createBundleMock.mockImplementation(async (content, workdir, filePath) => {
        await writeFile(path.join(workdir, filePath), 'aviavi');
      });
      getVersionCommandSpy = jest.spyOn(authBundler, 'getVersionCommand');
      computeRevisionMock.mockReturnValue('np-mockedrevision');

      s3client = new S3Client({
        credentials: { accessKeyId: cronOptions.s3.accessKeyId, secretAccessKey: cronOptions.s3.secretAccessKey },
        endpoint: cronOptions.s3.endpoint,
        region: 'us-east-1',
        forcePathStyle: true,
      });
    });

    beforeEach(function () {
      getVersionCommandSpy.mockResolvedValue('0.52.0');
      computeRevisionMock.mockReturnValue('np-mockedrevision');
    });

    afterEach(function () {
      jest.resetAllMocks();
    });

    afterAll(function () {
      jest.restoreAllMocks();
    });

    it('should create a bundle if no bundle exists', async function () {
      bundleRepoMock.findOne.mockResolvedValueOnce(null);
      bundleDbMock.getLatestVersions.mockResolvedValue({
        assets: [{ name: 'avi', version: 1 }],
        environment: Environment.NP,
        connections: [{ name: 'avi', version: 1 }],
        keyVersion: 1,
      });

      const promise = getJob(bundleRepoMock, bundleDbMock, Environment.NP, path.join(tmpdir(), 'authcrontests'))();

      await expect(promise).resolves.not.toThrow();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(bundleDbMock.saveBundle).toHaveBeenCalledTimes(1);
    });

    it('should create a bundle if the data versions changed', async function () {
      bundleRepoMock.findOne.mockResolvedValueOnce({
        id: 1,
        assets: [{ name: 'avi', version: 1 }],
        environment: Environment.NP,
        connections: [{ name: 'avi', version: 1 }],
        revision: 'np-12345678',
        keyVersion: 2,
        opaVersion: '0.52.0',
      });
      bundleDbMock.getLatestVersions.mockResolvedValue({
        assets: [{ name: 'avi', version: 1 }],
        environment: Environment.NP,
        connections: [{ name: 'avi', version: 1 }],
        keyVersion: 1,
      });

      const promise = getJob(bundleRepoMock, bundleDbMock, Environment.NP, path.join(tmpdir(), 'authcrontests'))();

      await expect(promise).resolves.not.toThrow();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(bundleDbMock.saveBundle).toHaveBeenCalledTimes(1);
    });

    it('should create a bundle and not save the metadata to the db if there is a mismatch between s3 and the db', async function () {
      bundleRepoMock.findOne.mockResolvedValueOnce({
        id: 1,
        assets: [{ name: 'avi', version: 1 }],
        environment: Environment.NP,
        connections: [{ name: 'avi', version: 1 }],
        keyVersion: 1,
        revision: 'np-12345678',
        hash: 'avi',
        opaVersion: '0.52.0',
      });
      bundleDbMock.getLatestVersions.mockResolvedValue({
        assets: [{ name: 'avi', version: 1 }],
        environment: Environment.NP,
        connections: [{ name: 'avi', version: 1 }],
        keyVersion: 1,
      });

      const promise = getJob(bundleRepoMock, bundleDbMock, Environment.NP, path.join(tmpdir(), 'authcrontests'))();

      await expect(promise).resolves.not.toThrow();
      expect(createBundle).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(bundleDbMock.saveBundle).toHaveBeenCalledTimes(0);
    });

    it('should not create a bundle if the bundle in s3 is up to date', async function () {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const res = await s3client.send(new PutObjectCommand({ Bucket: cronOptions.s3.bucket, Key: cronOptions.s3.key }));
      bundleRepoMock.findOne.mockResolvedValueOnce({
        id: 1,
        assets: [{ name: 'avi', version: 1 }],
        environment: Environment.NP,
        connections: [{ name: 'avi', version: 1 }],
        keyVersion: 1,
        hash: res.ETag,
        revision: 'np-mockedrevision',
        opaVersion: '0.52.0',
      });
      bundleDbMock.getLatestVersions.mockResolvedValue({
        assets: [{ name: 'avi', version: 1 }],
        environment: Environment.NP,
        connections: [{ name: 'avi', version: 1 }],
        keyVersion: 1,
      });

      const promise = getJob(bundleRepoMock, bundleDbMock, Environment.NP, path.join(tmpdir(), 'authcrontests'))();

      await expect(promise).resolves.not.toThrow();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(bundleDbMock.saveBundle).toHaveBeenCalledTimes(0);
    });

    it('should pass the computed revision to createBundle and saveBundle', async function () {
      const expectedRevision = 'np-test12345678';
      computeRevisionMock.mockReturnValueOnce(expectedRevision);

      bundleRepoMock.findOne.mockResolvedValueOnce(null);
      bundleDbMock.getLatestVersions.mockResolvedValue({
        assets: [{ name: 'avi', version: 1 }],
        environment: Environment.NP,
        connections: [{ name: 'avi', version: 1 }],
        keyVersion: 1,
      });

      await getJob(bundleRepoMock, bundleDbMock, Environment.NP, path.join(tmpdir(), 'authcrontests'))();

      expect(createBundleMock).toHaveBeenCalledWith(undefined, expect.anything(), expect.anything(), undefined, expectedRevision);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(bundleDbMock.saveBundle).toHaveBeenCalledWith(expect.anything(), expect.anything(), expectedRevision);
    });

    it('should create a bundle if the opa version is different than the one in the db', async function () {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const res = await s3client.send(new PutObjectCommand({ Bucket: cronOptions.s3.bucket, Key: cronOptions.s3.key }));
      bundleRepoMock.findOne.mockResolvedValueOnce({
        id: 1,
        assets: [{ name: 'avi', version: 1 }],
        environment: Environment.NP,
        connections: [{ name: 'avi', version: 1 }],
        keyVersion: 1,
        hash: res.ETag,
        revision: 'np-12345678',
        opaVersion: '0.51.0',
      });
      bundleDbMock.getLatestVersions.mockResolvedValue({
        assets: [{ name: 'avi', version: 1 }],
        environment: Environment.NP,
        connections: [{ name: 'avi', version: 1 }],
        keyVersion: 1,
      });

      const promise = getJob(bundleRepoMock, bundleDbMock, Environment.NP, path.join(tmpdir(), 'authcrontests'))();

      await expect(promise).resolves.not.toThrow();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(bundleDbMock.saveBundle).toHaveBeenCalledTimes(1);
    });
  });
});
