/* eslint-disable */

import { existsSync } from 'fs';
import { mkdir, writeFile, rm } from 'fs/promises';
import path from 'path';
import { render } from './templating';
import { Database } from './db';
import { validateBinaryExist, checkFiles, test, testCoverage, createBundle } from './opa';
import { createConnectionOptions, DbConfig, Environment, Key } from '@map-colonies/auth-core';
import { DataSource } from 'typeorm';
import config from 'config';
import { BundleContent } from './types';
import { tmpdir } from 'node:os';

const WORKDIR = '/tmp/opa-bundler';
const ENCODING = 'utf-8';

const handleKey = async (key: Key): Promise<void> => {
  const keyPath = path.join(WORKDIR, 'keys');
  await mkdir(keyPath, { recursive: true });
  await writeFile(path.join(keyPath, 'data.json'), JSON.stringify(key.publicKey), { encoding: ENCODING });
};

const createDirectoryStructure = async (bundle: BundleContent, basePath: string) => {
  if (!existsSync(basePath)) {
    throw new Error('basePath does not exist');
  }

  const { assets, connections } = bundle;

  for (const asset of assets) {
    let value = Buffer.from(asset.value, 'base64').toString('utf-8');

    if (asset.isTemplate) {
      value = render(value, connections);
    }
    const assetPath = path.join(basePath, asset.uri);

    await mkdir(assetPath, { recursive: true });

    let fileName: string = asset.name;

    if (asset.type === 'DATA') {
      fileName = 'data.' + fileName.split('.')[1];
    }

    await writeFile(path.join(assetPath, fileName), value, { encoding: ENCODING });
  }
};

const main = async (): Promise<void> => {
  if (existsSync(WORKDIR)) {
    await rm(WORKDIR, { force: true, recursive: true });
  }

  await mkdir(WORKDIR);

  // const connections = await getConnections('np');
  // console.log(connections);
  // await handleKey('np');
  // await handleAssets('np', connections);
  const connectionOptions = config.get<DbConfig>('db');

  const dataSource = new DataSource({
    ...createConnectionOptions(connectionOptions),
  });

  await dataSource.initialize();
  const database = new Database(dataSource);
  // const bundle = await database.getBundleFromVersions(await database.getLatestVersions(Environment.NP));
  // console.log(render(`{
  //   {{#delimitedEach .}}
  //     {{escapeJson name}}:{
  //       "noBrowser": {{allowNoBrowserConnection}}
  //     }
  //   {{/delimitedEach}}
  // }`,bundle.connections))
  await createDirectoryStructure(await database.getBundleFromVersions(await database.getLatestVersions(Environment.NP)), WORKDIR);
  await createBundle(WORKDIR, 'bundle.tar.gz')
  // console.log(await database.getLatestVersions(Environment.STAGE));
  // console.log(await database.getLatestVersions(Environment.PRODUCTION));

  if (!dataInDbIsNewer()) {
    if (storageHash != dbHash) {
      recreateBundle()
      uploadBundle()
    } else {
      doNothing()
    }
  }

  getnewDataFromDb()
  createBundle()
  uploadBundle()
  registerBundle()
};

main().catch(console.error);
