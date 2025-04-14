/// <reference types="jest-extended" />

import { mkdir, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import jsLogger from '@map-colonies/js-logger';
import { Environment } from '@map-colonies/auth-core';
import { createBundleDirectoryStructure } from '../src/bundler';
import { setLogger } from '../src/logger';
import { BundleContent } from '../src/types';
import { MissingPolicyFilesError } from '../src/errors';
import { getFakeBundleContent } from './utils/bundle';

const bundleContent = getFakeBundleContent();

const baseFolder = path.join(tmpdir(), 'authbundlertests', 'bundler');

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
        environment: Environment.PRODUCTION,
        assets: [],
        connections: [],
      };

      const promise = createBundleDirectoryStructure(content, baseFolder);

      await expect(promise).rejects.toThrow(MissingPolicyFilesError);
    });

    it('should log errors if there are no data, tests and key', async function () {
      const logger = jsLogger({
        enabled: false,
      });

      const warn = jest.spyOn(logger, 'warn');
      jest.spyOn(logger, 'child').mockReturnValue(logger);

      setLogger(logger);

      const content: BundleContent = {
        environment: Environment.PRODUCTION,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        assets: [bundleContent.assets[1]!],
        connections: [],
      };

      const promise = createBundleDirectoryStructure(content, baseFolder);

      await expect(promise).toResolve();
      expect(warn).toHaveBeenCalledTimes(3);
    });
  });
});
