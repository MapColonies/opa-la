/**
 * This file contains function to create the bundles directory structure.
 * @module
 * @ignore
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Asset, type AssetTypes, Key } from '@map-colonies/auth-core';
import { render } from './templating';
import { BundleContent } from './types';
import { logger } from './logger';
import { MissingPolicyFilesError } from './errors';

const ENCODING = 'utf-8';

/**
 * Helper function to save a file to a directory and create the directory if it doesn't exist.
 * @param filePath The path to which the file should be saved
 * @param fileName The name of the file to be saved
 * @param content The content of the file to be saved
 * @ignore
 */
async function saveFile(filePath: string, fileName: string, content: Parameters<typeof writeFile>['1']): Promise<void> {
  await mkdir(filePath, { recursive: true });
  await writeFile(path.join(filePath, fileName), content, { encoding: ENCODING });
}

/**
 * This function saves the authentication public key to the correct path.
 * Because of the way OPA works we name the file data.json.
 * @param basePath The directory path in which to save the file.
 * @param key The key to save to file
 * @ignore
 */
async function handleKey(basePath: string, key: Key): Promise<void> {
  const keyPath = path.join(basePath, 'keys');
  await saveFile(keyPath, 'data.json', JSON.stringify(key.publicKey));
}

/**
 * This function saves a asset to the disk and templates it if required.
 * @param basePath The root directory in which to save the assets. Some of them will be saved in subdirectories based on configuration.
 * @param asset The asset to save to disk.
 * @param context The data to pass into the template function
 * @ignore
 */
async function handleAsset(basePath: string, asset: Asset, context: unknown): Promise<void> {
  let value = Buffer.from(asset.value, 'base64').toString('utf-8');

  if (asset.isTemplate) {
    value = render(value, context);
  }
  const assetPath = path.join(basePath, asset.uri);

  let fileName: string = asset.name;

  if (asset.type === 'DATA') {
    // consider a different way to do this, we do this because OPA required data files to be called data.
    const extension = fileName.split('.')[1];
    if (extension === undefined) {
      throw new Error('data file name is missing extension');
    }
    fileName = 'data.' + extension;
  }

  await saveFile(assetPath, fileName, value);
}

/**
 * This function handles creating the directory structure of a bundle, and saving all the files into it.
 * @param bundle The content from which to create the bundle directory.
 * @param path The root directory in which to create the bundle.
 * @throws {@link MissingPolicyFilesError} When there are no policy files.
 * @ignore
 */
export async function createBundleDirectoryStructure(bundle: BundleContent, path: string): Promise<void> {
  const hasAssetType: Record<AssetTypes, boolean> = {
    /* eslint-disable @typescript-eslint/naming-convention */
    DATA: false,
    POLICY: false,
    TEST: false,
    TEST_DATA: false,
    /* eslint-enable @typescript-eslint/naming-convention */
  };

  for (const asset of bundle.assets) {
    logger?.debug({ msg: 'saving asset to disk', assetName: asset.name });
    hasAssetType[asset.type] = true;
    await handleAsset(path, asset, bundle.connections);
  }

  if (!hasAssetType.POLICY) {
    logger?.error('bundle missing policy files');
    throw new MissingPolicyFilesError('bundle missing policy files');
  }

  if (!hasAssetType.DATA) {
    logger?.warn('There are no data files in the bundle');
  }

  if (!hasAssetType.TEST) {
    logger?.warn('There are no test files in the bundle');
  }

  if (bundle.key) {
    await handleKey(path, bundle.key);
  } else {
    logger?.warn('key is missing from the bundle');
  }
}
