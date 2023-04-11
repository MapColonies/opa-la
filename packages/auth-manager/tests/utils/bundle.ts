import { faker } from '@faker-js/faker';
import { Environment, IBundle } from 'auth-core';

const EIGHT = 8;

export function getFakeBundle(includeCreated?: boolean): IBundle {
  return {
    id: includeCreated === true ? faker.datatype.number() : undefined,
    hash: faker.random.alphaNumeric(EIGHT),
    createdAt: includeCreated === true ? faker.date.past() : undefined,
    environment: Environment.NP,
    keyVersion: 1,
    assets: [{ name: 'aaaa', version: 1 }],
    connections: [{ name: 'bbb', version: 2 }],
    metadata: { ccc: 123 },
  };
}
