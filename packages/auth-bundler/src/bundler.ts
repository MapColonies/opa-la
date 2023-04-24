import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Asset, AssetType, Key } from '@map-colonies/auth-core';
import { render } from './templating';
import { BundleContent } from './types';

const ENCODING = 'utf-8';

async function saveFile(filePath: string, fileName: string, content: Parameters<typeof writeFile>['1']): Promise<void> {
  await mkdir(filePath, { recursive: true });
  await writeFile(path.join(filePath, fileName), content, { encoding: ENCODING });
}

async function handleKey(bashPath: string, key: Key): Promise<void> {
  const keyPath = path.join(bashPath, 'keys');
  await mkdir(keyPath, { recursive: true });
  await writeFile(path.join(keyPath, 'data.json'), JSON.stringify(key.publicKey), { encoding: ENCODING });
}

async function handleAsset(basePath: string, asset: Asset, context: unknown): Promise<void> {
  let value = Buffer.from(asset.value, 'base64').toString('utf-8');

  if (asset.isTemplate) {
    value = render(value, context);
  }
  const assetPath = path.join(basePath, asset.uri);

  let fileName: string = asset.name;

  if (asset.type === 'DATA') {
    fileName = 'data.' + fileName.split('.')[1];
  }

  await saveFile(assetPath, fileName, value);
}

export async function createBundleDirectoryStructure(bundle: BundleContent, path: string): Promise<void> {
  const hasAssetType: Record<AssetType, boolean> = {
    /* eslint-disable @typescript-eslint/naming-convention */
    "DATA": false,
    "POLICY": false,
    "TEST": false,
    "TEST_DATA": false
    /* eslint-enable @typescript-eslint/naming-convention */

  }

  for (const asset of bundle.assets) {
    hasAssetType[asset.type] = true;
    await handleAsset(path, asset, bundle.connections)
  }

  if (!hasAssetType.POLICY) {
    throw new Error('bundle missing policy files')
  }

  if (!hasAssetType.DATA) {
    console.warn('There are no data files in the bundle')
  }

  if (!hasAssetType.TEST) {
    console.warn('There are no test files in the bundle')
  }

  if (bundle.key) {
    await handleKey(path, bundle.key)
  } else {
    console.warn('key is missing from the bundle')
  }
}
