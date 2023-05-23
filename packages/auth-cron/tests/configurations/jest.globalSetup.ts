/* eslint-disable @typescript-eslint/naming-convention */
import { mkdir } from 'fs/promises';
import { existsSync } from 'node:fs';
import path from 'path';
import { tmpdir } from 'os';
import config from 'config';
import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { AppConfig } from '../../src/config';

export default async (): Promise<void> => {
  const folder = path.join(tmpdir(), 'authcrontests');
  if (!existsSync(folder)) {
    await mkdir(folder);
  }
  const cronOptions = config.get<AppConfig['cron']['np']>('cron.np');

  const s3client = new S3Client({
    credentials: { accessKeyId: cronOptions?.s3.accessKey as string, secretAccessKey: cronOptions?.s3.secretKey as string },
    endpoint: cronOptions?.s3.endpoint,
    region: 'us-east-1',
    forcePathStyle: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  try {
    await s3client.send(new HeadBucketCommand({ Bucket: cronOptions?.s3.bucket as string }));
  } catch (error) {
    await s3client.send(new CreateBucketCommand({ Bucket: cronOptions?.s3.bucket as string }));
  }
};
