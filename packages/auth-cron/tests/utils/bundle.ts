import { faker } from '@faker-js/faker';
import { BundleContent } from '@map-colonies/auth-bundler';
import { AssetType, Environment, IBundle } from '@map-colonies/auth-core';

const EIGHT = 8;

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

export function getFakeBundle(includeCreated?: boolean): IBundle {
  return {
    id: includeCreated === true ? faker.number.int() : undefined,
    hash: faker.string.alpha(EIGHT),
    createdAt: includeCreated === true ? faker.date.past() : undefined,
    environment: Environment.NP,
    keyVersion: 1,
    assets: [{ name: 'aaaa', version: 1 }],
    connections: [{ name: 'bbb', version: 2 }],
    metadata: { ccc: 123 },
    opaVersion: '0.52.0',
  };
}

export function getFakeBundleContent(): BundleContent {
  return {
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
      privateKey: { alg: 'a', d: 'a', kid: 'a', kty: 'a', p: 'a', q: 'a', dp: 'a', dq: 'a', qi: 'a', n: 'a', e: 'a' },
    },
  };
}
