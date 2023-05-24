import { faker } from '@faker-js/faker';
import { JWKPrivateKey, JWKPublicKey } from '@map-colonies/auth-core';

const LENGTH_OF_STRING = 3;

export function getMockKeys(): [JWKPrivateKey, JWKPublicKey] {
  const publicKey: JWKPublicKey = {
    alg: faker.datatype.string(LENGTH_OF_STRING),
    e: faker.datatype.string(LENGTH_OF_STRING),
    kid: faker.datatype.string(LENGTH_OF_STRING),
    kty: faker.datatype.string(LENGTH_OF_STRING),
    n: faker.datatype.string(LENGTH_OF_STRING),
  };
  return [
    {
      ...publicKey,
      d: faker.datatype.string(LENGTH_OF_STRING),
      dp: faker.datatype.string(LENGTH_OF_STRING),
      dq: faker.datatype.string(LENGTH_OF_STRING),
      p: faker.datatype.string(LENGTH_OF_STRING),
      q: faker.datatype.string(LENGTH_OF_STRING),
      qi: faker.datatype.string(LENGTH_OF_STRING),
    },
    publicKey,
  ];
}
