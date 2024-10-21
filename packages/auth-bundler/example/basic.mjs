/* eslint-disable */
import { mkdirSync } from 'node:fs';
import config from 'config';
import { DataSource } from 'typeorm';
import { createConnectionOptions } from '@map-colonies/auth-core';
import { createBundle, BundleDatabase } from '../dist/index.js';

const connectionOptions = config.get('db');

const dataSource = new DataSource({
  ...createConnectionOptions(connectionOptions),
});

await dataSource.initialize();

mkdirSync('workdir');

const db = new BundleDatabase(dataSource);

const versions = await db.getLatestVersions('np');

const bundle = await db.getBundleFromVersions(versions);

createBundle(bundle, 'workdir', '../bundle.tar.gz', { enable: false });
