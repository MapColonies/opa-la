import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { MinioContainer, type StartedMinioContainer } from '@testcontainers/minio';

const POSTGRES_IMAGE = 'postgres:15';
const MINIO_IMAGE = 'minio/minio:latest';

export const PG_PORT = 5432;

export async function createPostgresContainer(options: {
  username: string;
  database: string;
  password: string;
}): Promise<StartedPostgreSqlContainer> {
  let container = new PostgreSqlContainer(POSTGRES_IMAGE);

  if (process.env.CI === undefined) {
    container = container.withReuse();
  }

  return container.withUsername(options.username).withDatabase(options.database).withPassword(options.password).start();
}

export const MINIO_PORT = 9000;

export async function createMinioContainer(options: { username: string; password: string }): Promise<StartedMinioContainer> {
  const container = new MinioContainer(MINIO_IMAGE);

  if (process.env.CI === undefined) {
    container.withReuse();
  }

  return container.withUsername(options.username).withPassword(options.password).start();
}
