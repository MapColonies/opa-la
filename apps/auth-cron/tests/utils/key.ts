import { faker } from '@faker-js/faker';
import { JWKPrivateKey, JWKPublicKey } from '@map-colonies/auth-core';

const LENGTH_OF_STRING = 3;

export function getMockKeys(): [JWKPrivateKey, JWKPublicKey] {
  const publicKey: JWKPublicKey = {
    alg: faker.string.alpha(LENGTH_OF_STRING),
    e: faker.string.alpha(LENGTH_OF_STRING),
    kid: faker.string.alpha(LENGTH_OF_STRING),
    kty: faker.string.alpha(LENGTH_OF_STRING),
    n: faker.string.alpha(LENGTH_OF_STRING),
  };
  return [
    {
      ...publicKey,
      d: faker.string.alpha(LENGTH_OF_STRING),
      dp: faker.string.alpha(LENGTH_OF_STRING),
      dq: faker.string.alpha(LENGTH_OF_STRING),
      p: faker.string.alpha(LENGTH_OF_STRING),
      q: faker.string.alpha(LENGTH_OF_STRING),
      qi: faker.string.alpha(LENGTH_OF_STRING),
    },
    publicKey,
  ];
}
