import path from 'node:path';
import { initConnection } from '@map-colonies/auth-core';
import type { TestProject } from 'vitest/node';
import { createPostgresContainer, createAndProvideTempDir, removeTempDir, resetAndMigrate, mergeTestConfig } from 'test-utils';
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

  await mergeTestConfig(path.join(__dirname, '../../config'), { port: container.getPort() });

  const connection = await initConnection({ ...dataSourceOptions, port: container.getPort() });

  await resetAndMigrate(connection, dataSourceOptions.schema);
}

export async function teardown(): Promise<void> {
  await removeTempDir('authbundlertests');
}
