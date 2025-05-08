/* eslint-disable @typescript-eslint/naming-convention */
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { initConfig, getConfig } from '../../src/config';

export default async (): Promise<void> => {
  const folder = path.join(tmpdir(), 'authcrontests');
  if (!existsSync(folder)) {
    await mkdir(folder);
  }

  await initConfig();
  const configInstance = getConfig();
  const cronOptions = configInstance.get('cron.np');

  const s3client = new S3Client({
    credentials: { accessKeyId: cronOptions?.s3.accessKeyId as string, secretAccessKey: cronOptions?.s3.secretAccessKey as string },
    endpoint: cronOptions?.s3.endpoint,
    region: 'us-east-1',
    forcePathStyle: true,
  });

  try {
    await s3client.send(new HeadBucketCommand({ Bucket: cronOptions?.s3.bucket as string }));
  } catch {
    await s3client.send(new CreateBucketCommand({ Bucket: cronOptions?.s3.bucket as string }));
  }
};
