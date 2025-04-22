/// <reference types="jest-extended" />

import { tmpdir } from 'node:os';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import {
  OpaBundleCreationError,
  OpaCoverageTooLowError,
  OpaNotFoundError,
  OpaTestsFailedError,
  WorkdirNotFoundError,
  createBundle,
} from '@src/index';
import * as opa from '@src/opa';
import { getFakeBundleContent } from './utils/bundle';

const baseFolder = path.join(tmpdir(), 'authbundlertests', 'index');
const bundleContent = getFakeBundleContent();

describe('index.ts', function () {
  beforeAll(async function () {
    await mkdir(baseFolder, { recursive: true });
  });

  describe('#createBundle', function () {
    afterEach(function () {
      jest.resetAllMocks();
    });

    it('should run without errors', async function () {
      jest.spyOn(opa, 'validateBinaryExistCommand').mockResolvedValue(true);
      jest.spyOn(opa, 'createBundleCommand').mockResolvedValue([true, undefined]);

      const promise = createBundle(bundleContent, baseFolder, 'bundle.tar.gz', { enable: false });

      await expect(promise).toResolve();
    });

    it('should throw an error if the workdir given does not exist', async function () {
      const promise = createBundle(bundleContent, '/avi', 'bundle.tar.gz');

      await expect(promise).rejects.toThrow(WorkdirNotFoundError);
    });

    it('should throw an error if the opa binary is missing', async function () {
      jest.spyOn(opa, 'validateBinaryExistCommand').mockResolvedValue(false);
      const promise = createBundle(bundleContent, baseFolder, 'bundle.tar.gz');

      await expect(promise).rejects.toThrow(OpaNotFoundError);
    });

    it('should throw an error if the tests failed', async function () {
      const err = { x: 'd' };
      jest.spyOn(opa, 'validateBinaryExistCommand').mockResolvedValue(true);
      jest.spyOn(opa, 'testCommand').mockResolvedValue([false, err]);

      const promise = createBundle(bundleContent, baseFolder, 'bundle.tar.gz', { enable: true });

      await expect(promise).rejects.toThrow(OpaTestsFailedError);
    });

    it('should throw an error if the coverage is below the threshold', async function () {
      jest.spyOn(opa, 'validateBinaryExistCommand').mockResolvedValue(true);
      jest.spyOn(opa, 'testCommand').mockResolvedValue([true, undefined]);
      jest.spyOn(opa, 'testCoverageCommand').mockResolvedValue(60);

      const promise = createBundle(bundleContent, baseFolder, 'bundle.tar.gz', { enable: true, coverage: 80 });

      await expect(promise).rejects.toThrow(OpaCoverageTooLowError);
    });

    it('should throw an error if the bundle creation failed', async function () {
      const err = 'xd';
      jest.spyOn(opa, 'validateBinaryExistCommand').mockResolvedValue(true);
      jest.spyOn(opa, 'createBundleCommand').mockResolvedValue([false, err]);

      const promise = createBundle(bundleContent, baseFolder, 'bundle.tar.gz', { enable: false });

      await expect(promise).rejects.toThrow(OpaBundleCreationError);
    });
  });
});
