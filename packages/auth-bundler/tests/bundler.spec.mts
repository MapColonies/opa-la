/// <reference types="jest-extended" />

import { mkdir, mkdtemp, readdir } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, beforeAll, vi } from 'vitest';
import { jsLogger } from '@map-colonies/js-logger';
import { Environment } from '@map-colonies/auth-core';
import { getTempDir } from 'test-utils';
import { createBundleDirectoryStructure } from '@src/bundler.js';
import { setLogger } from '@src/logger.js';
import type { BundleContent } from '@src/types.js';
import { DuplicateAssetPathError, InvalidAssetPathError, MissingPolicyFilesError } from '@src/errors.js';
import { getFakeBundleContent } from './utils/bundle.js';

const bundleContent = getFakeBundleContent();

const baseFolder = path.join(getTempDir(), 'bundler');
const [dataAsset, policyAsset, testAsset] = bundleContent.assets as [
  BundleContent['assets'][number],
  BundleContent['assets'][number],
  BundleContent['assets'][number],
];

async function getEmptyDir(): Promise<string> {
  return mkdtemp(path.join(baseFolder, 'case-'));
}

describe('bundler.ts', function () {
  beforeAll(async function () {
    await mkdir(baseFolder, { recursive: true });
  });

  describe('#createBundleDirectoryStructure', function () {
    it('should create a bundle directory structure', async function () {
      const promise = createBundleDirectoryStructure(bundleContent, baseFolder);

      await expect(promise).toResolve();

      const files = await readdir(baseFolder);

      expect(files).toIncludeAllMembers(['example.rego', 'example_test.rego', 'data.json', 'keys']);
    });

    it('should throw an error if there are no policy files', async function () {
      const content: BundleContent = {
        environment: Environment.PROD,
        assets: [],
        connections: [],
      };

      const promise = createBundleDirectoryStructure(content, baseFolder);

      await expect(promise).rejects.toThrow(MissingPolicyFilesError);
    });

    it('should log errors if there are no data, tests and key', async function () {
      const logger = await jsLogger({
        enabled: false,
      });

      const warn = vi.spyOn(logger, 'warn');
      vi.spyOn(logger, 'child').mockReturnValue(logger as unknown as ReturnType<(typeof logger)['child']>);

      setLogger(logger);

      const content: BundleContent = {
        environment: Environment.PROD,
        assets: [bundleContent.assets[1]!],
        connections: [],
      };

      const promise = createBundleDirectoryStructure(content, baseFolder);

      await expect(promise).toResolve();
      expect(warn).toHaveBeenCalledTimes(3);
    });

    it('should return the paths of the test files', async function () {
      const dir = await getEmptyDir();

      const testFilePaths = await createBundleDirectoryStructure(bundleContent, dir);

      expect(testFilePaths).toStrictEqual([path.join(dir, 'example_test.rego')]);
    });

    it('should name a data file with multiple dots by its last extension', async function () {
      const dir = await getEmptyDir();
      const content: BundleContent = { ...bundleContent, assets: [{ ...dataAsset, name: 'roles.v2.json' }, policyAsset] };

      await createBundleDirectoryStructure(content, dir);

      expect(await readdir(dir)).toIncludeAllMembers(['data.json']);
    });

    it('should throw an error if two data assets are written to the same uri', async function () {
      const dir = await getEmptyDir();
      const content: BundleContent = { ...bundleContent, assets: [dataAsset, { ...dataAsset, name: 'other.json' }, policyAsset] };

      const promise = createBundleDirectoryStructure(content, dir);

      await expect(promise).rejects.toThrow(DuplicateAssetPathError);
    });

    it('should throw an error if a data asset is written to the same file as the key', async function () {
      const dir = await getEmptyDir();
      const content: BundleContent = { ...bundleContent, assets: [{ ...dataAsset, uri: '/keys' }, policyAsset] };

      const promise = createBundleDirectoryStructure(content, dir);

      await expect(promise).rejects.toThrow(DuplicateAssetPathError);
    });

    it.each([
      ['uri', { uri: '../../escaped' }],
      ['name', { name: '../escaped.rego' }],
    ])('should throw an error if the asset %s escapes the bundle directory', async function (_, override) {
      const dir = await getEmptyDir();
      const content: BundleContent = { ...bundleContent, assets: [{ ...policyAsset, ...override }] };

      const promise = createBundleDirectoryStructure(content, dir);

      await expect(promise).rejects.toThrow(InvalidAssetPathError);
    });

    it('should allow a leading slash in the uri', async function () {
      const dir = await getEmptyDir();
      const content: BundleContent = { ...bundleContent, assets: [{ ...policyAsset, uri: '/nested/dir' }, testAsset] };

      await createBundleDirectoryStructure(content, dir);

      expect(await readdir(path.join(dir, 'nested', 'dir'))).toStrictEqual(['example.rego']);
    });
  });
});
