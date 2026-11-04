/**
 * This file contains function to create the bundles directory structure.
 * @module
 * @ignore
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Asset, AssetType, Key } from '@map-colonies/auth-core';
import { render } from './templating';
import type { BundleContent } from './types';
import { logger } from './logger';
import { DuplicateAssetPathError, InvalidAssetPathError, MissingPolicyFilesError } from './errors';

const ENCODING = 'utf-8';
const KEY_DIR = 'keys';
const KEY_FILE_NAME = 'data.json';

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
  await saveFile(path.join(basePath, KEY_DIR), KEY_FILE_NAME, JSON.stringify(key.publicKey));
}

/**
 * Resolves the full path of the file an asset is written to.
 * Data files are renamed to data.<extension> because OPA only loads data files named that way.
 * @param basePath The root directory of the bundle
 * @param asset The asset to resolve the path of
 * @throws {@link InvalidAssetPathError} If the resolved path escapes the bundle directory.
 * @ignore
 */
function getAssetFilePath(basePath: string, asset: Asset): string {
  let fileName: string = asset.name;

  if (asset.type === 'DATA') {
    const extension = path.extname(fileName);
    if (extension === '') {
      throw new Error('data file name is missing extension');
    }
    fileName = 'data' + extension;
  }

  const root = path.resolve(basePath);
  const filePath = path.join(root, asset.uri, fileName);

  if (!filePath.startsWith(root + path.sep)) {
    throw new InvalidAssetPathError(`asset ${asset.name} resolves to a path outside the bundle directory`);
  }

  return filePath;
}

/**
 * This function handles saving an asset to file.
 * @param filePath The full path of the file to save the asset to
 * @param asset The asset to save
 * @param context The data to pass into the template function
 * @ignore
 */
async function handleAsset(filePath: string, asset: Asset, context: unknown): Promise<void> {
  let value = asset.value.toString('utf-8');

  if (asset.isTemplate) {
    value = render(value, context);
  }

  await saveFile(path.dirname(filePath), path.basename(filePath), value);
}

/**
 * This function handles creating the directory structure of a bundle, and saving all the files into it.
 * @param bundle The content from which to create the bundle directory.
 * @param basePath The root directory in which to create the bundle.
 * @returns The paths of the written test files, so they can be removed before building the bundle.
 * @throws {@link MissingPolicyFilesError} When there are no policy files.
 * @throws {@link DuplicateAssetPathError} When two assets resolve to the same file.
 * @ignore
 */
export async function createBundleDirectoryStructure(bundle: BundleContent, basePath: string): Promise<string[]> {
  const hasAssetType: Record<keyof typeof AssetType, boolean> = {
    /* eslint-disable @typescript-eslint/naming-convention */
    DATA: false,
    POLICY: false,
    TEST: false,
    TEST_DATA: false,
    /* eslint-enable @typescript-eslint/naming-convention */
  };

  const assetsByPath = new Map<string, string>();
  const testFilePaths: string[] = [];

  for (const asset of bundle.assets) {
    logger?.debug({ msg: 'saving asset to disk', assetName: asset.name });
    const filePath = getAssetFilePath(basePath, asset);

    const existingAssetName = assetsByPath.get(filePath);
    if (existingAssetName !== undefined) {
      throw new DuplicateAssetPathError(`assets ${existingAssetName} and ${asset.name} are both written to ${path.relative(basePath, filePath)}`);
    }
    assetsByPath.set(filePath, asset.name);

    hasAssetType[asset.type] = true;
    await handleAsset(filePath, asset, bundle.connections);

    if (asset.type === 'TEST' || asset.type === 'TEST_DATA') {
      testFilePaths.push(filePath);
    }
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
    const keyAssetName = assetsByPath.get(path.join(path.resolve(basePath), KEY_DIR, KEY_FILE_NAME));
    if (keyAssetName !== undefined) {
      throw new DuplicateAssetPathError(`asset ${keyAssetName} is written to the same file as the key`);
    }
    await handleKey(basePath, bundle.key);
  } else {
    logger?.warn('key is missing from the bundle');
  }

  return testFilePaths;
}
