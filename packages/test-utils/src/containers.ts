import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
// import { MinioContainer, type StartedMinioContainer,  } from '@testcontainers/minio';
import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers';

const POSTGRES_IMAGE = 'postgres:15';
const SEAWEEDFS_IMAGE = 'chrislusf/seaweedfs:4.47';

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

export const S3_PORT = 8333;
export const S3_UI_PORT = 8888;

export async function createS3Container(options: { username: string; password: string }): Promise<StartedTestContainer> {
  const container = new GenericContainer(SEAWEEDFS_IMAGE)
    .withExposedPorts(S3_PORT, S3_UI_PORT)
    .withEnvironment({
      /* eslint-disable @typescript-eslint/naming-convention */
      AWS_ACCESS_KEY_ID: options.username,
      AWS_SECRET_ACCESS_KEY: options.password,
      S3_BUCKET: 'test-bucket',
      /* eslint-enable @typescript-eslint/naming-convention */
    })
    .withWaitStrategy(Wait.forLogMessage('/.*All enabled components are running and ready to use.*/'));

  if (process.env.CI === undefined) {
    container.withReuse();
  }
  return container.start();
}
