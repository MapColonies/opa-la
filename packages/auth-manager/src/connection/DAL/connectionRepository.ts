import { FactoryFunction } from 'tsyringe';
import { DataSource, Repository } from 'typeorm';
import { Environment } from '../../common/constants';
import { Connection } from '../models/connection';

export type ConnectionRepository = Repository<Connection> & {
  getMaxVersionWithLock: (name: string, environment: Environment) => Promise<number | null>;
};

export const connectionRepositoryFactory: FactoryFunction<ConnectionRepository> = (container) => {
  const dataSource = container.resolve(DataSource);

  return dataSource.getRepository(Connection).extend({
    async getMaxVersionWithLock(name: string, environment: Environment): Promise<number | null> {
      const result = await this.createQueryBuilder()
        .select('version')
        .where('name = :name AND environment = :environment')
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select('MAX(version)')
            .from(Connection, 'connection')
            .where('name = :name AND environment = :environment')
            .getQuery();

          return 'Connection.version = ' + subQuery;
        })
        .setLock('pessimistic_write')
        .setParameters({ name, environment })
        .getRawOne<{ version: number }>();

      if (result === undefined) {
        return null;
      }
      return result.version;
    },
  });
};
