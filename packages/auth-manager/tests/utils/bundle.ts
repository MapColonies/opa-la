import { faker } from '@faker-js/faker';
import { Environment, IBundle } from '@map-colonies/auth-core';

const EIGHT = 8;

export function getFakeBundle(includeCreated?: boolean): IBundle {
  const id = includeCreated === true ? faker.number.int() : undefined;
  return {
    id,
    hash: faker.string.alpha(EIGHT),
    createdAt: includeCreated === true ? faker.date.past() : undefined,
    environment: Environment.NP,
    revision: `${Environment.NP}-${id}`,
    keyVersion: 1,
    assets: [{ name: 'aaaa', version: 1 }],
    connections: [{ name: 'bbb', version: 2 }],
    metadata: { ccc: 123 },
    opaVersion: '0.52.0',
  };
}
