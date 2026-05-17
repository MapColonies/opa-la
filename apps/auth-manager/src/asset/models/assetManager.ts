import { type Logger } from '@map-colonies/js-logger';
import { Asset, assetTable, type Drizzle, NewAsset } from '@map-colonies/auth-core';
import { inject, injectable } from 'tsyringe';
import { and, eq } from 'drizzle-orm';
import { operations } from 'auth-openapi';
import { SERVICES } from '@common/constants';
import { AssetRepository } from '../DAL/assetRepository';
import { AssetVersionMismatchError, AssetNotFoundError } from './errors';

@injectable()
export class AssetManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(AssetRepository) private readonly assetRepository: AssetRepository,
    @inject(SERVICES.DRIZZLE) private readonly drizzle: Drizzle
  ) {}

  public async getAssets(searchParams: NonNullable<operations['getAssets']['parameters']['query']>): Promise<Asset[]> {
    this.logger.info({ msg: 'fetching assets', searchParams });
    const { environment, isTemplate, type } = searchParams;

    // return this.assetRepository.findBy({ environment: environment ? ArrayContains(environment) : undefined, isTemplate, type });
    return this.drizzle.query.asset.findMany({
      where: {
        isTemplate,
        type,
        environment: environment ? { arrayContains: environment } : undefined,
      },
    });
  }

  public async getNamedAssets(name: string): Promise<Asset[]> {
    this.logger.info({ msg: 'fetching all specific environment assets', asset: { name } });

    // return this.assetRepository.findBy({ name });
    return this.drizzle.query.asset.findMany({ where: { name } });
  }

  public async getAsset(name: string, version: number): Promise<Asset> {
    this.logger.info({ msg: 'fetching asset', asset: { name, version } });

    // const asset = await this.assetRepository.findOne({ where: { name, version } });
    const asset = await this.drizzle.query.asset.findFirst({ where: { name, version } });

    if (asset === undefined) {
      this.logger.debug('asset was not found in the database');
      throw new AssetNotFoundError('asset was not found in the database');
    }
    return asset;
  }

  public async getLatestAsset(name: string): Promise<Asset> {
    this.logger.info({ msg: 'fetching latest asset', asset: { name } });
    const version = await this.assetRepository.getMaxVersion(name);
    if (version === null) {
      this.logger.debug('latest asset was not found in the database');
      throw new AssetNotFoundError('latest asset was not found in the database');
    }
    return this.getAsset(name, version);
  }

  public async upsertAsset(asset: NewAsset): Promise<Asset> {
    this.logger.info({ msg: 'upserting asset', asset: { environment: asset.environment, version: asset.version } });

    return this.drizzle.transaction(async (tx) => {
      const maxVersion = await this.assetRepository.getMaxVersionWithLock(asset.name, tx);

      if (maxVersion === null) {
        if (asset.version !== 1) {
          const msg = 'given asset version is not 1, when no asset already exists';
          this.logger.debug({ msg, clientAssetVersion: asset.version });
          throw new AssetVersionMismatchError(msg);
        }

        // insert
        return (await tx.insert(assetTable).values(asset).returning())[0] as Asset;
      }

      if (maxVersion !== asset.version) {
        const msg = 'version mismatch between database asset and given asset';
        this.logger.debug({ msg, clientAssetVersion: asset.version, dbAssetVersion: maxVersion });
        throw new AssetVersionMismatchError(msg);
      }

      // update
      return (
        await tx
          .update(assetTable)
          .set({ ...asset, version: maxVersion + 1 })
          .where(and(eq(assetTable.name, asset.name), eq(assetTable.version, maxVersion)))
          .returning()
      )[0] as Asset;
    });
  }
}
