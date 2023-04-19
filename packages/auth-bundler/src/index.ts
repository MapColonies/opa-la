/* eslint-disable */

import { existsSync } from 'fs';
import { mkdir, writeFile, rm } from 'fs/promises';
import path from 'path';
import { render } from './templating';
import { getBundleFromVersions } from './db/actions';
import { validateBinaryExist, checkFiles, test, testCoverage, createBundle } from './opa';
import { Environment } from '@map-colonies/auth-core';

const WORKDIR = '/tmp/opa-bundler';
const ENCODING = 'utf-8';

// const handleKey = async (env: string) => {
//   const key = await getKey(env);
//   const keyPath = path.join(WORKDIR, 'keys');
//   await mkdir(keyPath, { recursive: true });
//   await writeFile(path.join(keyPath, 'data.json'), JSON.stringify(key.public_key), { encoding: ENCODING });
// };

// const handleAssets = async (env: string, context: any) => {
//   const assets = await getAssets(env);
//   for (const asset of assets) {
//     let value = asset.value.toString(ENCODING);
//     console.log(asset);

//     if (asset.is_template) {
//       value = render(value, context);
//     }
//     const assetPath = path.join(WORKDIR, asset.uri);

//     await mkdir(assetPath, { recursive: true });

//     let fileName: string = asset.name;

//     if (asset.type === 'DATA') {
//       fileName = 'data.' + fileName.split('.')[1];
//     }

//     await writeFile(path.join(assetPath, fileName), value, { encoding: ENCODING });
//   }
// };

const main = async (): Promise<void> => {
  // if (existsSync(WORKDIR)) {
  //   await rm(WORKDIR, { force: true, recursive: true });
  // }

  // await mkdir(WORKDIR);

  // const connections = await getConnections('np');
  // console.log(connections);
  // await handleKey('np');
  // await handleAssets('np', connections);
  console.log(await getBundleFromVersions({ assets: [{ name: 'string', version: 1 }], connections: [], key: 1, environment: Environment.NP }));
};

main().catch(console.error);
