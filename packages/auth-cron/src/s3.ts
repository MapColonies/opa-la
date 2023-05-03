import { readFileSync } from 'node:fs';
import config from 'config';
import { StatusCodes } from 'http-status-codes';
import { HeadBucketCommand, HeadObjectCommand, NotFound, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Environment } from '@map-colonies/auth-core';
import { AppConfig, CronConfig, S3Config } from './config';

// export const s3client = new S3Client({
//   credentials: { accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin' },
//   endpoint: 'http://localhost:9000',
//   region: 'us-east-1',
//   forcePathStyle: true,
// });

class S3client {
  private readonly s3client: S3Client;
  private readonly bucket: string;
  private readonly key: string;

  public constructor(config: S3Config) {
    this.s3client = new S3Client({
      credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey },
      endpoint: config.endpoint,
      region: 'us-east-1',
      forcePathStyle: true,
    });
    this.bucket = config.bucket;
    this.key = config.key;
  }

  public async getObjectHash(): Promise<string | undefined> {
    try {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const command = new HeadObjectCommand({ Bucket: this.bucket, Key: this.key });
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

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const command = new PutObjectCommand({ Body: file, Bucket: this.bucket, Key: this.key, ContentType: 'application/gzip' });

    const res = await this.s3client.send(command);

    return res.ETag ?? '';
  }
}

const s3Clients = new Map<Environment, S3client>();
const s3Config = config.get<AppConfig['cron']>('cron');

export function getS3Client(env: Environment): S3client {
  let client = s3Clients.get(env);
  if (!client && s3Config[env] !== undefined) {
    client = new S3client((s3Config[env] as CronConfig).s3);
    s3Clients.set(env,client);
  } else {
    throw new Error();
  }
  return client;
}
