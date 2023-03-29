import { faker } from '@faker-js/faker';
import { IClient } from '../../src/client/models/client';

export function getFakeClient(includeGeneratedFields: boolean): IClient {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const client: IClient = {
    name: faker.internet.userName(firstName, lastName),
    hebName: 'אבי',
    branch: faker.company.bsBuzz(),
    description: faker.lorem.paragraph(),
    techPointOfContact: {
      email: faker.internet.email(firstName, lastName),
      name: faker.name.fullName({ firstName, lastName }),
      phone: faker.phone.number(),
    },
    productPointOfContact: {
      email: faker.internet.email(firstName, lastName),
      name: faker.name.fullName({ firstName, lastName }),
      phone: faker.phone.number(),
    },
    tags: [faker.word.adjective(), faker.company.bsBuzz()],
  };

  if (includeGeneratedFields) {
    client.createdAt = faker.date.past();
    client.updatedAt = faker.date.between(client.createdAt, Date.now());
  }
  return client;
}
