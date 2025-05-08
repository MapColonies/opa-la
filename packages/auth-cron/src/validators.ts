import { Environments } from '@map-colonies/auth-core';
import { getS3Client } from './s3';
import { logger } from './telemetry/logger';

export async function validateS3(envs: Environments[]): Promise<void> {
  for (const env of envs) {
    logger?.debug({ msg: 'checking if bucket exists', s3Env: env });
    const doesExist = await getS3Client(env).doesBucketExist();
    if (!doesExist) {
      throw new Error('The bucket does not exist');
    }
  }
}
