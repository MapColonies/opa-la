import { faker } from '@faker-js/faker';
import { IClient } from '@map-colonies/auth-core';

export function getFakeClient(includeGeneratedFields: boolean): IClient {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const client: IClient = {
    name: faker.internet.username({ firstName, lastName }),
    hebName: 'אבי',
    branch: faker.company.buzzVerb(),
    description: faker.lorem.paragraph(),
    techPointOfContact: {
      email: faker.internet.email({ firstName, lastName }),
      name: faker.person.fullName({ firstName, lastName }),
      phone: faker.phone.number(),
    },
    productPointOfContact: {
      email: faker.internet.email({ firstName, lastName }),
      name: faker.person.fullName({ firstName, lastName }),
      phone: faker.phone.number(),
    },
    tags: [faker.word.adjective(), faker.company.buzzNoun()],
  };

  if (includeGeneratedFields) {
    client.createdAt = faker.date.past();
    client.updatedAt = faker.date.between({ from: client.createdAt, to: Date.now() });
  }
  return client;
}
