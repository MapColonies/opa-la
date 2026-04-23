import { CreateBucketCommand, HeadBucketCommand, S3Client, type S3ClientConfig } from '@aws-sdk/client-s3';

export interface S3ConnectionOptions {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
}

export function createS3Client(options: S3ConnectionOptions): S3Client {
  return new S3Client({
    credentials: { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey },
    endpoint: options.endpoint,
    region: options.region ?? 'us-east-1',
    forcePathStyle: true,
  } satisfies S3ClientConfig);
}

/**
 * Creates the bucket if it does not already exist.
 */
export async function ensureBucketExists(client: S3Client, bucket: string): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}
