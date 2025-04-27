import { faker } from '@faker-js/faker';
import { AssetType, Environment, IAsset } from '@map-colonies/auth-core';

const EIGHT = 8;

export function getFakeAsset(includeCreated?: boolean): IAsset {
  return {
    createdAt: includeCreated === true ? faker.date.past() : undefined,
    environment: [Environment.NP],
    isTemplate: faker.datatype.boolean(),
    name: faker.string.sample(EIGHT),
    type: faker.helpers.arrayElement(Object.values(AssetType)),
    uri: faker.system.filePath(),
    value: Buffer.from(faker.lorem.paragraph()).toString('base64'),
    version: 1,
  };
}
