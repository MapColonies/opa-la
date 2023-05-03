import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Environment } from '@map-colonies/auth-core';
import Ajv from 'ajv';
import betterAjvErrors from 'better-ajv-errors';
import config from 'config';
import { AppConfig, configSchema } from './config';
import { getS3Client } from './s3';

const ajv = new Ajv();

export function validateConfigSchema(config:AppConfig): void {
  const validate = ajv.compile(configSchema);

  if (!validate(config)) {
    const err = betterAjvErrors(configSchema, config, validate.errors ?? [], { format: 'js' });
    throw new Error(err[0].error);
  }
}

export async function validateS3(envs: Environment[]): Promise<void> {
  for (const env of envs) {
    const doesExist = await getS3Client(env).doesBucketExist();
    if (!doesExist) {
      throw new Error();
    }
  }
}
