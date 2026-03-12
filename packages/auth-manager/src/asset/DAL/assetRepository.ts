import { Asset } from '@map-colonies/auth-core';
import { FactoryFunction } from 'tsyringe';
import { ArrayContains, DataSource, Repository } from 'typeorm';
import { Criteria } from '../models/assetManager';

export type AssetRepository = Repository<Asset> & {
  getMaxVersionWithLock: (name: string) => Promise<number | null>;
  getMaxVersion: (name: string) => Promise<number | null>;
  findAllBy: (criteria: Criteria) => Promise<Asset[]>;
};

export const assetRepositoryFactory: FactoryFunction<AssetRepository> = (container) => {
  const dataSource = container.resolve(DataSource);

  return dataSource.getRepository(Asset).extend({
    // New method to find the latest assets based on dynamic criteria
    async findAllBy(criteria): Promise<Asset[]> {
      // Start building the main query, filtering by the initial criteria
      const qb = this.createQueryBuilder();

      if (criteria.isTemplate !== undefined) {
        qb.andWhere('isTemplate = :isTemplate', {
          isTemplate: criteria.isTemplate,
        });
      }

      if (criteria.type !== undefined) {
        qb.andWhere('type = :type', {
          type: criteria.type,
        });
      }

      if (criteria.environment !== undefined) {
        qb.andWhere({
          environment: ArrayContains(criteria.environment),
        });
      }

      if (criteria.latest ?? false) {
        qb.distinctOn(['name']).orderBy({
          name: 'ASC',
          version: 'DESC',
        });
      }

      const result = await qb.getMany();

      return result;
    },

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
    async getMaxVersion(name: string): Promise<number | null> {
      const result = await this.createQueryBuilder()
        .select('MAX(version)', 'version')
        .where('name = :name')
        .setParameter('name', name)
        .getRawOne<{ version: number }>();

      if (result === undefined) {
        return null;
      }
      return result.version;
    },
  });
};
