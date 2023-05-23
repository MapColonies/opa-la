import { Domain } from '@map-colonies/auth-core';
import { FactoryFunction } from 'tsyringe';
import { DataSource, Repository } from 'typeorm';

export type DomainRepository = Repository<Domain> & {
  checkInputForNonExistingDomains: (domainNames: string[]) => Promise<string[]>;
};

export const domainRepositoryFactory: FactoryFunction<DomainRepository> = (container) => {
  const dataSource = container.resolve(DataSource);

  return dataSource.getRepository(Domain).extend({
    async checkInputForNonExistingDomains(domainNames: string[]): Promise<string[]> {
      // unnest is a postgresql only function on array datatype
      // I wrote raw sql because typeorm doesn't think that using a function in FROM is a real thing and treats it like a table name
      const res = (await this.manager.query(
        `
        SELECT i.name FROM unnest($1::text[]) i(name) LEFT JOIN auth_manager.domain d ON i.name = d.name WHERE d.name is NULL`,
        [domainNames]
      )) as unknown as  { name: string }[];

      return res.map((domain) => domain.name);
    },
  });
};
