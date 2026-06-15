/// <reference types="jest-extended" />

import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { describe, expect, it, beforeAll, afterEach, vi } from 'vitest';
import { getTempDir } from 'test-utils';
import {
  OpaBundleCreationError,
  OpaCoverageTooLowError,
  OpaNotFoundError,
  OpaTestsFailedError,
  WorkdirNotFoundError,
  createBundle,
} from '@src/index.js';
import * as opa from '@src/opa.js';
import { getFakeBundleContent } from './utils/bundle.js';

const baseFolder = path.join(getTempDir(), 'index');
const bundleContent = getFakeBundleContent();

describe('index.ts', function () {
  beforeAll(async function () {
    await mkdir(baseFolder, { recursive: true });
  });

  describe('#createBundle', function () {
    afterEach(function () {
      vi.resetAllMocks();
    });

    it('should run without errors', async function () {
      vi.spyOn(opa, 'validateBinaryExistCommand').mockResolvedValue(true);
      vi.spyOn(opa, 'createBundleCommand').mockResolvedValue([true, undefined]);

      const promise = createBundle(bundleContent, baseFolder, 'bundle.tar.gz', { enable: false });

      await expect(promise).toResolve();
    });

    it('should throw an error if the workdir given does not exist', async function () {
      const promise = createBundle(bundleContent, '/avi', 'bundle.tar.gz');

      await expect(promise).rejects.toThrow(WorkdirNotFoundError);
    });

    it('should throw an error if the opa binary is missing', async function () {
      vi.spyOn(opa, 'validateBinaryExistCommand').mockResolvedValue(false);
      const promise = createBundle(bundleContent, baseFolder, 'bundle.tar.gz');

      await expect(promise).rejects.toThrow(OpaNotFoundError);
    });

    it('should throw an error if the tests failed', async function () {
      const err = { x: 'd' };
      vi.spyOn(opa, 'validateBinaryExistCommand').mockResolvedValue(true);
      vi.spyOn(opa, 'testCommand').mockResolvedValue([false, err]);

      const promise = createBundle(bundleContent, baseFolder, 'bundle.tar.gz', { enable: true });

      await expect(promise).rejects.toThrow(OpaTestsFailedError);
    });

    it('should throw an error if the coverage is below the threshold', async function () {
      vi.spyOn(opa, 'validateBinaryExistCommand').mockResolvedValue(true);
      vi.spyOn(opa, 'testCommand').mockResolvedValue([true, undefined]);
      vi.spyOn(opa, 'testCoverageCommand').mockResolvedValue(60);

      const promise = createBundle(bundleContent, baseFolder, 'bundle.tar.gz', { enable: true, coverage: 80 });

      await expect(promise).rejects.toThrow(OpaCoverageTooLowError);
    });

    it('should throw an error if the bundle creation failed', async function () {
      const err = 'xd';
      vi.spyOn(opa, 'validateBinaryExistCommand').mockResolvedValue(true);
      vi.spyOn(opa, 'createBundleCommand').mockResolvedValue([false, err]);

      const promise = createBundle(bundleContent, baseFolder, 'bundle.tar.gz', { enable: false });

      await expect(promise).rejects.toThrow(OpaBundleCreationError);
    });

    it('should pass the revision to createBundleCommand when provided', async function () {
      const createBundleCommandSpy = vi.spyOn(opa, 'createBundleCommand').mockResolvedValue([true, undefined]);
      vi.spyOn(opa, 'validateBinaryExistCommand').mockResolvedValue(true);

      await createBundle(bundleContent, baseFolder, 'bundle.tar.gz', { enable: false }, 'np-abc123def456');

      expect(createBundleCommandSpy).toHaveBeenCalledWith(baseFolder, 'bundle.tar.gz', 'np-abc123def456');
    });

    it('should pass undefined revision to createBundleCommand when not provided', async function () {
      const createBundleCommandSpy = vi.spyOn(opa, 'createBundleCommand').mockResolvedValue([true, undefined]);
      vi.spyOn(opa, 'validateBinaryExistCommand').mockResolvedValue(true);

      await createBundle(bundleContent, baseFolder, 'bundle.tar.gz', { enable: false });

      expect(createBundleCommandSpy).toHaveBeenCalledWith(baseFolder, 'bundle.tar.gz', undefined);
    });
  });
});
