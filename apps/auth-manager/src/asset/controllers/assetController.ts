import { HttpError } from '@map-colonies/error-express-handler';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { type Logger } from '@map-colonies/js-logger';
import type { TypedRequestHandlers, components } from '@openapi';
import { SERVICES } from '@common/constants';
import { AssetManager, type ResponseAsset } from '../models/assetManager';
import { AssetNotFoundError, AssetVersionMismatchError } from '../models/errors';

/**
 * Converts an asset entity to the OpenAPI schema format
 * @param asset - The asset entity to convert
 * @returns The asset formatted according to OpenAPI schema
 */
function responseAssetToOpenApi(asset: ResponseAsset): components['schemas']['asset'] {
  return {
    ...asset,
    createdAt: asset.createdAt.toISOString(),
  };
}

@injectable()
export class AssetController {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(AssetManager) private readonly manager: AssetManager
  ) {}

  /**
   * Get all assets matching the query filters
   */
  public getAssets: TypedRequestHandlers['getAssets'] = async (req, res, next) => {
    this.logger.debug('executing #getAssets handler');

    try {
      const assets = await this.manager.getAssets(req.query ?? {});
      return res.status(httpStatus.OK).json(assets.map(responseAssetToOpenApi));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Get all assets with a specific name
   */
  public getNamedAssets: TypedRequestHandlers['getAsset'] = async (req, res, next) => {
    this.logger.debug('executing #getNamedAssets handler');

    try {
      const assets = await this.manager.getNamedAssets(req.params.assetName);
      return res.status(httpStatus.OK).json(assets.map(responseAssetToOpenApi));
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Get a specific asset by name and version
   */
  public getAsset: TypedRequestHandlers['getVersionedAsset'] = async (req, res, next) => {
    this.logger.debug('executing #getAsset handler');

    try {
      const asset = await this.manager.getAsset(req.params.assetName, req.params.version);
      return res.status(httpStatus.OK).json(responseAssetToOpenApi(asset));
    } catch (error) {
      if (error instanceof AssetNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }
  };

  /**
   * Get the latest asset by name
   */
  public getLatestAsset: TypedRequestHandlers['getLatestAsset'] = async (req, res, next) => {
    this.logger.debug('executing #getLatestAsset handler');

    try {
      const asset = await this.manager.getLatestAsset(req.params.assetName);
      return res.status(httpStatus.OK).json(responseAssetToOpenApi(asset));
    } catch (error) {
      if (error instanceof AssetNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }
  };

  /**
   * Create a new asset or update an existing one based on version
   */
  public upsertAsset: TypedRequestHandlers['upsertAsset'] = async (req, res, next) => {
    this.logger.debug('executing #upsertAsset handler');

    try {
      const createdAsset = await this.manager.upsertAsset(req.body);

      const returnStatus = createdAsset.version === 1 ? httpStatus.CREATED : httpStatus.OK;
      return res.status(returnStatus).json(responseAssetToOpenApi(createdAsset));
    } catch (error) {
      if (error instanceof AssetVersionMismatchError) {
        (error as HttpError).status = httpStatus.CONFLICT;
      }
      return next(error);
    }
  };
}
