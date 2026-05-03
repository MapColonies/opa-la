import path from 'node:path';
import { initConnection } from '@map-colonies/auth-core';
import type { TestProject } from 'vitest/node';
import { createPostgresContainer, PG_PORT, createAndProvideTempDir, removeTempDir, resetAndMigrate, mergeTestConfig } from 'test-utils';
import { getConfig, initConfig } from '../helpers/config.js';

export async function setup(project: TestProject): Promise<void> {
  await createAndProvideTempDir('authbundlertests', project);

  await initConfig();

  const dataSourceOptions = getConfig().getAll();
  const container = await createPostgresContainer({
    username: dataSourceOptions.username,
    database: dataSourceOptions.database,
    password: dataSourceOptions.password,
  });

  const port = container.getMappedPort(PG_PORT);

  await mergeTestConfig(path.join(__dirname, '../../config'), { port });

  const connection = await initConnection({ ...dataSourceOptions, port });

  await resetAndMigrate(connection, dataSourceOptions.schema);
}

export async function teardown(): Promise<void> {
  await removeTempDir('authbundlertests');
}
