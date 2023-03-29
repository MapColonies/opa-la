import { FactoryFunction } from 'tsyringe';
import { DataSource, Repository } from 'typeorm';
import { Environment } from '../../common/constants';
import { Key } from '../models/key';

export type KeyRepository = Repository<Key> & {
  getMaxVersionWithLock: (env: Environment) => Promise<number | null>;
  getLatestKeys: () => Promise<Key[]>;
};

export const keyRepositoryFactory: FactoryFunction<KeyRepository> = (container) => {
  const dataSource = container.resolve(DataSource);

  return dataSource.getRepository(Key).extend({
    async getMaxVersionWithLock(env: Environment): Promise<number | null> {
      const result = await this.createQueryBuilder()
        .select('version')
        .where('environment = :environment')
        .andWhere((qb) => {
          const subQuery = qb.subQuery().select('MAX(version)').from(Key, 'key').where('environment = :environment').getQuery();

          return 'Key.version = ' + subQuery;
        })
        .setLock('pessimistic_write')
        .setParameter('environment', env)
        .getRawOne<{ version: number }>();

      if (result === undefined) {
        return null;
      }
      return result.version;
    },
    async getLatestKeys(): Promise<Key[]> {
      // This is a way to do it using window functions. i think its more efficient but its less readable.
      // I left it here because i worked a lot on it, and it got some nice stuff for future reference.
      // Both this and the version below returns the same result.
      // const query = this.createQueryBuilder()
      //   .from<Key>((qb) => {
      //     return qb.select('*, ROW_NUMBER() OVER(PARTITION BY environment ORDER BY version desc) as rn').from(Key, 'key');
      //   }, 'Key')
      //   .where('rn = 1');

      // query.expressionMap.aliases = [query.expressionMap.aliases[1]];
      // if (query.expressionMap.mainAlias !== undefined) {
      //   query.expressionMap.mainAlias.metadata = query.connection.getMetadata(Key);
      // }

      const query = this.createQueryBuilder('keys').innerJoin(
        (qb) => qb.select('environment, MAX(version) as version').from(Key, 'k').groupBy('environment'),
        'max_keys',
        'keys.version = max_keys.version AND keys.environment = max_keys.environment'
      );

      return query.getMany();
    },
  });
};
