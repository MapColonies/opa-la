import path from 'node:path';
import type { TestProject } from 'vitest/node';
import {
  createMinioContainer,
  MINIO_PORT,
  createS3Client,
  createAndProvideTempDir,
  removeTempDir,
  mergeTestConfig,
  ensureBucketExists,
} from 'test-utils';
import { getConfig, initConfig } from '@src/config.js';

export async function setup(project: TestProject): Promise<void> {
  await createAndProvideTempDir('authcrontests', project);
  await initConfig(true);
  const configInstance = getConfig();
  const cronOptions = configInstance.get('cron.np');

  const container = await createMinioContainer({
    username: cronOptions?.s3.accessKeyId as string,
    password: cronOptions?.s3.secretAccessKey as string,
  });

  const endpoint = `http://${container.getHost()}:${container.getMappedPort(MINIO_PORT)}`;

  await mergeTestConfig(path.join(__dirname, '../../config'), { 'cron.np.s3.endpoint': endpoint, 'cron.prod.s3.endpoint': endpoint });

  const client = createS3Client({
    endpoint,
    accessKeyId: cronOptions?.s3.accessKeyId as string,
    secretAccessKey: cronOptions?.s3.secretAccessKey as string,
  });

  await ensureBucketExists(client, cronOptions?.s3.bucket as string);
}

export async function teardown(): Promise<void> {
  await removeTempDir('authcrontests');
}
