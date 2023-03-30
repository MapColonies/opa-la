import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { ArrayContains } from 'typeorm';
import { SERVICES } from '../../common/constants';
import { AssetRepository } from '../DAL/assetRepository';
import { AssetSearchParams, IAsset } from './asset';
import { AssetVersionMismatchError, AssetNotFoundError } from './errors';

@injectable()
export class AssetManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.ASSET_REPOSITORY) private readonly assetRepository: AssetRepository
  ) {}

  public async getAssets(searchParams: AssetSearchParams): Promise<IAsset[]> {
    this.logger.info({ msg: 'fetching assets', searchParams });
    const { environment, isTemplate, type } = searchParams;

    return this.assetRepository.findBy({ environment: environment ? ArrayContains(environment) : undefined, isTemplate, type });
  }

  public async getNamedAssets(name: string): Promise<IAsset[]> {
    this.logger.info({ msg: 'fetching all specific environment assets', asset: { name } });

    return this.assetRepository.findBy({ name });
  }

  public async getAsset(name: string, version: number): Promise<IAsset> {
    this.logger.info({ msg: 'fetching asset', asset: { name, version } });

    const asset = await this.assetRepository.findOne({ where: { name, version } });

    if (asset === null) {
      this.logger.debug('asset was not found in the database');
      throw new AssetNotFoundError('asset was not found in the database');
    }
    return asset;
  }

  public async upsertAsset(asset: IAsset): Promise<IAsset> {
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
      console.log(asset.version);

      return transactionRepo.save({ ...asset, version: maxVersion + 1 });
    });
  }
}
