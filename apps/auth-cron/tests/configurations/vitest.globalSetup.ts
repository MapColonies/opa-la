import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { CreateBucketCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { getConfig, initConfig } from '@src/config';

export async function setup(): Promise<void> {
  const folder = path.join(tmpdir(), 'authcrontests');
  if (!existsSync(folder)) {
    await mkdir(folder);
  }

  await initConfig(true);
  const configInstance = getConfig();
  const cronOptions = configInstance.get('cron.np');

  const s3client = new S3Client({
    credentials: { accessKeyId: cronOptions?.s3.accessKeyId as string, secretAccessKey: cronOptions?.s3.secretAccessKey as string },
    endpoint: cronOptions?.s3.endpoint,
    region: 'us-east-1',
    forcePathStyle: true,
  });

  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    await s3client.send(new HeadBucketCommand({ Bucket: cronOptions?.s3.bucket as string }));
  } catch (err) {
    console.error(err);
    // eslint-disable-next-line @typescript-eslint/naming-convention
    await s3client.send(new CreateBucketCommand({ Bucket: cronOptions?.s3.bucket as string }));
  }
}

export async function teardown(): Promise<void> {
  await rm(path.join(tmpdir(), 'authcrontests'), { force: true, recursive: true });
}
