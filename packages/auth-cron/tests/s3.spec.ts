// /// <reference types="jest-extended" />

import { createHash } from 'crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Environment } from '@map-colonies/auth-core';
import { infraOpalaCronV1Type } from '@map-colonies/schemas';
import jsLogger from '@map-colonies/js-logger';
import { initConfig, getConfig } from '../src/config';
import { getS3Client } from '../src/s3';
import * as appConfig from '../src/config';

jest.mock('../src/logger', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    logger: jsLogger({ enabled: false }),
  };
});

jest.mock('../src/config', () => {
  const originalModule = jest.requireActual<typeof appConfig>('../src/config');
  const getConfigReplacement = () => {
    const instance = originalModule.getConfig();

    const getReplacement = (path: string) => {
      if (path === 'cron.np') {
        const cronOptions = structuredClone(instance.get(path));
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        cronOptions!.s3.key = 'xd';

        return cronOptions;
      }
      return instance.get(path);
    };

    return { ...instance, get: getReplacement };
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    ...originalModule,
    getConfig: getConfigReplacement,
  };
});

describe('s3.ts', function () {
  let s3client: S3Client;
  let cronOptions: Exclude<infraOpalaCronV1Type['cron']['np'], undefined>;

  beforeAll(async function () {
    await initConfig(true);
    cronOptions = getConfig().get('cron.np') as Exclude<infraOpalaCronV1Type['cron']['np'], undefined>;
    s3client = new S3Client({
      credentials: { accessKeyId: cronOptions.s3.accessKeyId, secretAccessKey: cronOptions.s3.secretAccessKey },
      endpoint: cronOptions.s3.endpoint,
      region: 'us-east-1',
      forcePathStyle: true,
    });
  });

  describe('#getS3Client', function () {
    it('should throw an error if env is not defined', function () {
      expect(() => getS3Client('avi' as Environment)).toThrow();
    });
  });
  describe('#getObjectHash', function () {
    it('should return the hash if the object exists', async function () {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      await s3client.send(new PutObjectCommand({ Bucket: cronOptions.s3.bucket, Key: 'xd', Body: 'avi' }));
      const expectedHash = createHash('md5').update('avi').digest('hex');

      const hash = await getS3Client(Environment.NP).getObjectHash();

      expect(hash).toBe('"' + expectedHash + '"');
    });

    it('should return undefined if the object does not exists', async function () {
      const hash = await getS3Client(Environment.PRODUCTION).getObjectHash();

      expect(hash).toBeUndefined();
    });

    it('should throw if something went wrong', async function () {
      const promise = getS3Client(Environment.STAGE).getObjectHash();

      await expect(promise).rejects.toThrow();
    });
  });

  describe('#doesBucketExist', function () {
    it('should return true if the bucket exists', async function () {
      const res = await getS3Client(Environment.NP).doesBucketExist();

      expect(res).toBe(true);
    });

    it('should return false if the bucket does not exist', async function () {
      const res = await getS3Client(Environment.PRODUCTION).doesBucketExist();

      expect(res).toBe(false);
    });

    it('should throw if something went wrong', async function () {
      const promise = getS3Client(Environment.STAGE).doesBucketExist();

      await expect(promise).rejects.toThrow();
    });
  });

  describe('#uploadFile', function () {
    it('should upload the object', async function () {
      const filePath = path.join(tmpdir(), 'authcrontests', 'avi.txt');
      writeFileSync(filePath, 'abcdefg');

      const hash = await getS3Client(Environment.NP).uploadFile(filePath);

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const res = await s3client.send(new GetObjectCommand({ Bucket: cronOptions.s3.bucket, Key: 'xd' }));

      expect(res.ETag).toBe(hash);
      expect(await res.Body?.transformToString()).toBe('abcdefg');
    });

    it('should throw if something is wrong', async function () {
      const promise = getS3Client(Environment.NP).uploadFile('avi');

      await expect(promise).rejects.toThrow();
    });
  });
});
