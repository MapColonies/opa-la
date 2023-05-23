// /// <reference types="jest-extended" />

import { createHash } from 'crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { writeFileSync } from 'fs';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Environment } from '@map-colonies/auth-core';
import jsLogger from '@map-colonies/js-logger';
import config from 'config';
import { AppConfig } from '../src/config';
import { getS3Client } from '../src/s3';

jest.mock('../src/logger', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    logger: jsLogger({ enabled: false }),
  };
});

jest.mock('config', () => {
  const originalModule = jest.requireActual<typeof config>('config');
  const cronOptions = originalModule.util.cloneDeep(originalModule.get<AppConfig['cron']>('cron')) as AppConfig['cron'];

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  cronOptions.np!.s3.key = 'xd';

  const getReplacement = (setting: string): unknown => {
    if (setting === 'cron') {
      return cronOptions;
    }
    return originalModule.get(setting);
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: { ...originalModule, get: getReplacement },
  };
});

describe('s3.ts', function () {
  let s3client: S3Client;
  const cronOptions = config.get<AppConfig['cron']['np']>('cron.np');

  beforeAll(function () {
    s3client = new S3Client({
      credentials: { accessKeyId: cronOptions?.s3.accessKey as string, secretAccessKey: cronOptions?.s3.secretKey as string },
      endpoint: cronOptions?.s3.endpoint,
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
      await s3client.send(new PutObjectCommand({ Bucket: cronOptions?.s3.bucket as string, Key: 'xd', Body: 'avi' }));
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
      const res = await s3client.send(new GetObjectCommand({ Bucket: cronOptions?.s3.bucket, Key: 'xd' }));

      expect(res.ETag).toBe(hash);
      expect(await res.Body?.transformToString()).toBe('abcdefg');
    });

    it('should throw if something is wrong', async function () {
      const promise = getS3Client(Environment.NP).uploadFile('avi');

      await expect(promise).rejects.toThrow();
    });
  });
});
