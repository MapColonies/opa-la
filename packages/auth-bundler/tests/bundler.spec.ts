/// <reference types="jest-extended" />

import { mkdir, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import jsLogger from '@map-colonies/js-logger';
import { AssetType, Environment } from '@map-colonies/auth-core';
import { createBundleDirectoryStructure } from '../src/bundler';
import { setLogger } from '../src/logger';
import { BundleContent } from '../src/types';

const baseAsset = { createdAt: new Date(), environment: [Environment.PRODUCTION], version: 1 };

const policy = Buffer.from(
  `
allow {
  true
}
`
).toString('base64');

const test = Buffer.from(
  `
test_allow {
  true
}
`
).toString('base64');

const data = Buffer.from(`{{#delimitedEach .}}{{name}}{{/delimitedEach}}`).toString('base64');

const baseFolder = path.join(tmpdir(), 'authbundlertests', 'bundler');

describe('bundler.ts', function () {
  beforeAll(async function () {
    await mkdir(baseFolder, { recursive: true });
  });

  describe('#createBundleDirectoryStructure', function () {
    it('should create a bundle directory structure', async function () {
      const content: BundleContent = {
        environment: Environment.PRODUCTION,
        assets: [
          {
            ...baseAsset,
            isTemplate: true,
            name: 'avi.json',
            type: AssetType.DATA,
            uri: '/',
            value: data,
          },
          {
            ...baseAsset,
            isTemplate: true,
            name: 'example.rego',
            type: AssetType.POLICY,
            uri: '/',
            value: policy,
          },
          {
            ...baseAsset,
            isTemplate: true,
            name: 'example_test.rego',
            type: AssetType.TEST,
            uri: '/',
            value: test,
          },
        ],
        connections: [
          {
            allowNoBrowserConnection: true,
            allowNoOriginConnection: true,
            createdAt: new Date(),
            domains: [],
            enabled: true,
            environment: Environment.PRODUCTION,
            name: 'avi',
            origins: [],
            token: '',
            version: 1,
          },
        ],
        key: {
          environment: Environment.PRODUCTION,
          version: 1,
          publicKey: { alg: 'a', e: 'a', kid: 'a', kty: 'a', n: 'a' },
        },
      };

      const promise = createBundleDirectoryStructure(content, baseFolder);

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

      await expect(promise).rejects.toThrow();
    });

    it('should log errors if there are no data, tests and key', async function () {
      const logger = jsLogger({ enabled: false });
      const warn = jest.spyOn(logger, 'warn');

      setLogger(logger);

      const content: BundleContent = {
        environment: Environment.PRODUCTION,
        assets: [
          {
            ...baseAsset,
            isTemplate: true,
            name: 'example.rego',
            type: AssetType.POLICY,
            uri: '/',
            value: policy,
          },
        ],
        connections: [],
      };

      const promise = createBundleDirectoryStructure(content, baseFolder);

      await expect(promise).toResolve();
      expect(warn).toHaveBeenCalledTimes(3);
    });
  });
});
