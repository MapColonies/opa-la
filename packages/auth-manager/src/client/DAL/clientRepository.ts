import { FactoryFunction } from 'tsyringe';
import { DataSource, Repository } from 'typeorm';
import { Client } from '../models/client';

export type ClientRepository = Repository<Client> & { updateAndReturn: (name: string, client: Omit<Client, 'name'>) => Promise<Client | null> };

export const clientRepositoryFactory: FactoryFunction<ClientRepository> = (container) => {
  const dataSource = container.resolve(DataSource);

  return dataSource.getRepository(Client).extend({
    async updateAndReturn(name: string, client: Omit<Client, 'name'>): Promise<Client | null> {
      const updateResult = await this.createQueryBuilder().update(Client).set(client).where('name = :name', { name }).execute();

      if (updateResult.affected === 0) {
        return null;
      }
      return this.findOne({ where: { name } });
    },
  });
};
