import { Client } from 'auth-core';
import { FactoryFunction } from 'tsyringe';
import { DataSource, Repository } from 'typeorm';

export type ClientRepository = Repository<Client> & { updateAndReturn: (client: Client) => Promise<Client | null> };

export const clientRepositoryFactory: FactoryFunction<ClientRepository> = (container) => {
  const dataSource = container.resolve(DataSource);

  return dataSource.getRepository(Client).extend({
    async updateAndReturn(client: Client): Promise<Client | null> {
      return this.manager.transaction(async (transactionManager) => {
        const dbClient = await transactionManager
          .createQueryBuilder(Client, 'client')
          .where('name = :name', { name: client.name })
          .setLock('pessimistic_write')
          .getOne();

        if (dbClient === null) {
          return null;
        }

        return transactionManager.save(Client, { ...dbClient, ...client });
      });
    },
  });
};
