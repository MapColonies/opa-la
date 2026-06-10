import { AssetType, Environment } from '@map-colonies/auth-core';
import type { BundleContent } from '@src/index';

const baseAsset = { createdAt: new Date(), environment: [Environment.PROD], version: 1 };

const policy = Buffer.from(
  `
allow {
  true
}
`
);

const test = Buffer.from(
  `
test_allow {
  true
}
`
);

const data = Buffer.from(`{{#delimitedEach .}}{{name}}{{/delimitedEach}}`);

export function getFakeBundleContent(): BundleContent {
  return {
    environment: Environment.PROD,
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
        environment: Environment.PROD,
        name: 'avi',
        origins: [],
        token: '',
        version: 1,
      },
    ],
    key: {
      environment: Environment.PROD,
      version: 1,
      publicKey: { alg: 'a', e: 'a', kid: 'a', kty: 'a', n: 'a' },
      privateKey: { alg: 'a', e: 'a', kid: 'a', kty: 'a', n: 'a', d: 'a', dp: 'a', dq: 'a', p: 'a', q: 'a', qi: 'a' },
    },
  };
}
