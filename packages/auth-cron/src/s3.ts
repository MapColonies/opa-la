import { readFileSync } from 'node:fs';
import { HeadObjectCommand, NotFound, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export const s3client = new S3Client({
  credentials: { accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin' },
  endpoint: 'http://localhost:9000',
  region: 'us-east-1',
  forcePathStyle: true,
});

export async function getObjectHash(bucket: string, key: string): Promise<string | undefined> {
  try {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
    const res = await s3client.send(command);
    return res.ETag;
  } catch (error) {
    if (error instanceof NotFound) {
      return undefined;
    }
    throw error;
  }
}

export async function uploadFile(bucket: string, key: string, filePath: string): Promise<string> {
  const file = readFileSync(filePath);

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const command = new PutObjectCommand({ Body: file, Bucket: bucket, Key: key, ContentType: 'application/gzip' });

  const res = await s3client.send(command);

  return res.ETag ?? '';
}
