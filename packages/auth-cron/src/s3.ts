import { readFileSync } from 'node:fs';
import config from 'config';
import { StatusCodes } from 'http-status-codes';
import { HeadBucketCommand, HeadObjectCommand, NotFound, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Environment } from '@map-colonies/auth-core';
import { AppConfig, CronConfig, S3Config } from './config';
import { logger } from './logger';

class S3client {
  private readonly s3client: S3Client;
  private readonly bucket: string;
  private readonly key: string;
  private readonly endpoint: string;

  public constructor(config: S3Config) {
    this.s3client = new S3Client({
      credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey },
      endpoint: config.endpoint,
      region: 'us-east-1',
      forcePathStyle: true,
    });
    this.bucket = config.bucket;
    this.key = config.key;
    this.endpoint = config.endpoint;
  }

  public async getObjectHash(): Promise<string | undefined> {
    try {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const command = new HeadObjectCommand({ Bucket: this.bucket, Key: this.key });
      logger.debug({ msg: 'fetching object metadata from s3', bucket: this.bucket, key: this.key, endpoint: this.endpoint });
      const res = await this.s3client.send(command);
      return res.ETag;
    } catch (error) {
      if (error instanceof NotFound) {
        return undefined;
      }
      throw error;
    }
  }

  public async doesBucketExist(): Promise<boolean> {
    try {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const command = new HeadBucketCommand({ Bucket: this.bucket });
      logger.debug({ msg: 'fetching bucket metadata from s3', bucket: this.bucket, endpoint: this.endpoint });
      const res = await this.s3client.send(command);
      return res.$metadata.httpStatusCode === StatusCodes.OK;
    } catch (error) {
      if (error instanceof NotFound) {
        return false;
      }
      throw error;
    }
  }

  public async uploadFile(filePath: string): Promise<string> {
    const file = readFileSync(filePath);

    logger.debug({ msg: 'uploading object to s3', bucket: this.bucket, key: this.key, endpoint: this.endpoint });
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const command = new PutObjectCommand({ Body: file, Bucket: this.bucket, Key: this.key, ContentType: 'application/gzip' });

    const res = await this.s3client.send(command);

    return res.ETag ?? '';
  }
}

const s3Clients = new Map<Environment, S3client>();
const cronConfig = config.get<AppConfig['cron']>('cron');

export function getS3Client(env: Environment): S3client {
  console.log(env);

  let client = s3Clients.get(env);
  if (!client) {
    if (cronConfig[env] !== undefined) {
      const s3Config = (cronConfig[env] as CronConfig).s3;
      logger.debug({ msg: 'initializing new s3 connection', s3Env: env, endpoint: s3Config.endpoint });
      client = new S3client(s3Config);
      s3Clients.set(env, client);
    } else {
      logger.warn({ msg: 'failed initializing s3 client for undefined env', s3Env: env });
      throw new Error();
    }
  }
  return client;
}
