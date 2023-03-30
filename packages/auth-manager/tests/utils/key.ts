import { faker } from '@faker-js/faker';
import { JWKPrivateKey, JWKPublicKey } from '../../src/key/models/key';

const THREE = 3;

export function getMockKeys(): [JWKPrivateKey, JWKPublicKey] {
  const publicKey: JWKPublicKey = {
    alg: faker.datatype.string(THREE),
    e: faker.datatype.string(THREE),
    kid: faker.datatype.string(THREE),
    kty: faker.datatype.string(THREE),
    n: faker.datatype.string(THREE),
  };
  return [
    {
      ...publicKey,
      d: faker.datatype.string(THREE),
      dp: faker.datatype.string(THREE),
      dq: faker.datatype.string(THREE),
      p: faker.datatype.string(THREE),
      q: faker.datatype.string(THREE),
      qi: faker.datatype.string(THREE),
    },
    publicKey,
  ];
}
