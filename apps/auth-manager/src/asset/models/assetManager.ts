import { type Logger } from '@map-colonies/js-logger';
import { IAsset } from '@map-colonies/auth-core';
import { inject, injectable } from 'tsyringe';
import { ArrayContains } from 'typeorm';
import type { SetRequired } from 'type-fest';
import { operations } from '@openapi';
import { SERVICES } from '@common/constants';
import { type AssetRepository } from '../DAL/assetRepository';
import { AssetVersionMismatchError, AssetNotFoundError } from './errors';

export type ResponseAsset = SetRequired<IAsset, 'createdAt'>;
export type RequestAsset = Omit<IAsset, 'createdAt'>;

@injectable()
export class AssetManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.ASSET_REPOSITORY) private readonly assetRepository: AssetRepository
  ) {}

  public async getAssets(searchParams: NonNullable<operations['getAssets']['parameters']['query']>): Promise<ResponseAsset[]> {
    this.logger.info({ msg: 'fetching assets', searchParams });
    const { environment, isTemplate, type } = searchParams;

    return this.assetRepository.findBy({ environment: environment ? ArrayContains(environment) : undefined, isTemplate, type });
  }

  public async getNamedAssets(name: string): Promise<ResponseAsset[]> {
    this.logger.info({ msg: 'fetching all specific environment assets', asset: { name } });

    return this.assetRepository.findBy({ name });
  }

  public async getAsset(name: string, version: number): Promise<ResponseAsset> {
    this.logger.info({ msg: 'fetching asset', asset: { name, version } });

    const asset = await this.assetRepository.findOne({ where: { name, version } });

    if (asset === null) {
      this.logger.debug('asset was not found in the database');
      throw new AssetNotFoundError('asset was not found in the database');
    }
    return asset;
  }

  public async getLatestAsset(name: string): Promise<ResponseAsset> {
    this.logger.info({ msg: 'fetching latest asset', asset: { name } });
    const version = await this.assetRepository.getMaxVersion(name);
    if (version === null) {
      this.logger.debug('latest asset was not found in the database');
      throw new AssetNotFoundError('latest asset was not found in the database');
    }
    return this.getAsset(name, version);
  }

  public async upsertAsset(asset: RequestAsset): Promise<ResponseAsset> {
    this.logger.info({ msg: 'upserting asset', asset: { environment: asset.environment, version: asset.version } });
    return this.assetRepository.manager.transaction(async (transactionManager) => {
      const transactionRepo = transactionManager.withRepository(this.assetRepository);

      const maxVersion = await transactionRepo.getMaxVersionWithLock(asset.name);

      if (maxVersion === null) {
        if (asset.version !== 1) {
          const msg = 'given asset version is not 1, when no asset already exists';
          this.logger.debug({ msg, clientAssetVersion: asset.version });
          throw new AssetVersionMismatchError(msg);
        }

        // insert
        return transactionRepo.save(asset);
      }

      if (maxVersion !== asset.version) {
        const msg = 'version mismatch between database asset and given asset';
        this.logger.debug({ msg, clientAssetVersion: asset.version, dbAssetVersion: maxVersion });

        throw new AssetVersionMismatchError(msg);
      }

      // update
      return transactionRepo.save({ ...asset, version: maxVersion + 1 });
    });
  }
}
