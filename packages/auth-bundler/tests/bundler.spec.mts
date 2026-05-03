/// <reference types="jest-extended" />

import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, beforeAll, vi } from 'vitest';
import { jsLogger } from '@map-colonies/js-logger';
import { Environment } from '@map-colonies/auth-core';
import { getTempDir } from 'test-utils';
import { createBundleDirectoryStructure } from '@src/bundler.js';
import { setLogger } from '@src/logger.js';
import type { BundleContent } from '@src/types.js';
import { MissingPolicyFilesError } from '@src/errors.js';
import { getFakeBundleContent } from './utils/bundle.js';

const bundleContent = getFakeBundleContent();

const baseFolder = path.join(getTempDir(), 'bundler');

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

      const warn = vi.spyOn(logger, 'warn');
      vi.spyOn(logger, 'child').mockReturnValue(logger as unknown as ReturnType<(typeof logger)['child']>);

      setLogger(logger);

      const content: BundleContent = {
        environment: Environment.PRODUCTION,
        assets: [bundleContent.assets[1]!],
        connections: [],
      };

      const promise = createBundleDirectoryStructure(content, baseFolder);

      await expect(promise).toResolve();
      expect(warn).toHaveBeenCalledTimes(3);
    });
  });
});
