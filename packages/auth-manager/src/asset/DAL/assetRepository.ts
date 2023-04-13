import { Asset } from '@map-colonies/auth-core';
import { FactoryFunction } from 'tsyringe';
import { DataSource, Repository } from 'typeorm';

export type AssetRepository = Repository<Asset> & {
  getMaxVersionWithLock: (name: string) => Promise<number | null>;
};

export const assetRepositoryFactory: FactoryFunction<AssetRepository> = (container) => {
  const dataSource = container.resolve(DataSource);

  return dataSource.getRepository(Asset).extend({
    async getMaxVersionWithLock(name: string): Promise<number | null> {
      const result = await this.createQueryBuilder()
        .select('version')
        .where('name = :name')
        .andWhere((qb) => {
          const subQuery = qb.subQuery().select('MAX(version)').from(Asset, 'asset').where('name = :name').getQuery();

          return 'Asset.version = ' + subQuery;
        })
        .setLock('pessimistic_write')
        .setParameter('name', name)
        .getRawOne<{ version: number }>();

      if (result === undefined) {
        return null;
      }
      return result.version;
    },
  });
};
