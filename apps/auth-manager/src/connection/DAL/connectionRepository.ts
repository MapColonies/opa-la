import { Connection, Environments } from '@map-colonies/auth-core';
import { FactoryFunction } from 'tsyringe';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

const maxVersionSubQuery = (qb: SelectQueryBuilder<Connection>): string => {
  const subQuery = qb
    .subQuery()
    .select('MAX(version)')
    .from(Connection, 'connection')
    .where('name = :name AND environment = :environment')
    .getQuery();

  return 'Connection.version = ' + subQuery;
};

export type ConnectionRepository = Repository<Connection> & {
  getMaxVersionWithLock: (name: string, environment: Environments) => Promise<number | null>;
  getMaxVersion: (name: string, environment: Environments) => Promise<number | null>;
};

export const connectionRepositoryFactory: FactoryFunction<ConnectionRepository> = (container) => {
  const dataSource = container.resolve(DataSource);

  return dataSource.getRepository(Connection).extend({
    async getMaxVersionWithLock(name: string, environment: Environments): Promise<number | null> {
      const result = await this.createQueryBuilder()
        .select('version')
        .where('name = :name AND environment = :environment')
        .andWhere(maxVersionSubQuery)
        .setLock('pessimistic_write')
        .setParameters({ name, environment })
        .getRawOne<{ version: number }>();

      if (result === undefined) {
        return null;
      }
      return result.version;
    },
    async getMaxVersion(name: string, environment: Environments): Promise<number | null> {
      const result = await this.createQueryBuilder()
        .select('MAX(version)', 'version')
        .where('name = :name AND environment = :environment')
        .setParameters({ name, environment })
        .getRawOne<{ version: number }>();

      if (result === undefined) {
        return null;
      }
      return result.version;
    },
  });
};
