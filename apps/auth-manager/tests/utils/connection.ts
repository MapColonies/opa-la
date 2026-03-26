import { faker } from '@faker-js/faker';
import { Connection, Environment, IConnection } from '@map-colonies/auth-core';

const EIGHT = 8;

export function getFakeConnection(): Connection {
  return {
    createdAt: faker.date.past(),
    environment: Environment.NP,
    version: 1,
    name: faker.string.sample(EIGHT),
    allowNoBrowserConnection: faker.datatype.boolean(),
    allowNoOriginConnection: faker.datatype.boolean(),
    domains: ['alpha', 'bravo'],
    origins: ['c', 'd'],
    enabled: true,
    token: faker.string.alpha(),
  };
}

export function getFakeIConnection(includeCreated?: boolean): IConnection {
  const connection: IConnection = getFakeConnection();
  connection.createdAt = includeCreated === true ? faker.date.past() : undefined;

  return connection;
}
