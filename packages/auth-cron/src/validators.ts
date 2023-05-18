import { Environment } from '@map-colonies/auth-core';
import Ajv from 'ajv';
import betterAjvErrors from 'better-ajv-errors';
import { AppConfig, configSchema } from './config';
import { getS3Client } from './s3';
import { logger } from './logger';

const ajv = new Ajv();

export function validateConfigSchema(config: AppConfig): void {
  const validate = ajv.compile(configSchema);

  if (!validate(config)) {
    const err = betterAjvErrors(configSchema, config, validate.errors ?? [], { format: 'js' });
    logger?.debug('schema validation failed');
    throw new Error(err[0].error);
  }
}

export async function validateS3(envs: Environment[]): Promise<void> {
  for (const env of envs) {
    logger?.debug({ msg: 'checking if bucket exists', s3Env: env });
    const doesExist = await getS3Client(env).doesBucketExist();
    if (!doesExist) {
      throw new Error('The bucket does not exist');
    }
  }
}
