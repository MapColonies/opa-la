import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { BundleContentVersions } from '@map-colonies/auth-bundler';
import { compareVersionsToBundle, emptyDir } from '../src/util';
import { getFakeBundle } from './utils/bundle';
import { Bundle } from '@map-colonies/auth-core';

describe('util.ts', function () {
  describe('#emptyDir', function () {
    it('should empty the dir', async function () {
      const folderPath = path.join(tmpdir(), 'authcrontests', 'empty');
      mkdirSync(folderPath);
      writeFileSync(path.join(folderPath, 'file.txt'), 'data');

      await emptyDir(folderPath);

      expect(existsSync(path.join(folderPath, 'file.txt'))).toBe(false);
    });
  });

  describe('#compareVersionsToBundle', function () {
    const bundle: Bundle = getFakeBundle() as Bundle;
    const versions: BundleContentVersions = {
      assets: bundle.assets as BundleContentVersions['assets'],
      connections: bundle.connections as BundleContentVersions['connections'],
      environment: bundle.environment,
      keyVersion: bundle.keyVersion,
    };

    it('should return true is the bundle and versions are equal', function () {
      expect(compareVersionsToBundle(bundle, versions)).toBe(true);
    });

    it('should return false if the environment is not equal', function () {
      expect(compareVersionsToBundle(bundle, { ...versions, keyVersion: 9999 })).toBe(false);
    });

    it('should return false if the connections are not equal', function () {
      expect(compareVersionsToBundle(bundle, { ...versions, connections: [] })).toBe(false);
    });
  });
});
