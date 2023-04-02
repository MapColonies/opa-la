import { HttpError } from '@map-colonies/error-express-handler';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { AssetSearchParams, IAsset } from '../models/asset';

import { AssetManager } from '../models/assetManager';
import { AssetNotFoundError, AssetVersionMismatchError } from '../models/errors';
import { SERVICES } from '../../common/constants';

interface AssetPathParams {
  assetName: string;
}

type UpsertAssetHandler = RequestHandler<undefined, IAsset, IAsset>;
type GetAssetsHandler = RequestHandler<undefined, IAsset[], undefined, AssetSearchParams>;
type GetNamedAssetsHandler = RequestHandler<AssetPathParams, IAsset[]>;
type GetAssetHandler = RequestHandler<AssetPathParams & { version: number }, IAsset>;

@injectable()
export class AssetController {
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger, @inject(AssetManager) private readonly manager: AssetManager) {}

  public getAssets: GetAssetsHandler = async (req, res, next) => {
    this.logger.debug('executing #getAssets handler');

    try {
      return res.status(httpStatus.OK).json(await this.manager.getAssets(req.query));
    } catch (error) {
      return next(error);
    }
  };

  public getNamedAssets: GetNamedAssetsHandler = async (req, res, next) => {
    this.logger.debug('executing #getNamedAssets handler');

    try {
      return res.status(httpStatus.OK).json(await this.manager.getNamedAssets(req.params.assetName));
    } catch (error) {
      return next(error);
    }
  };

  public getAsset: GetAssetHandler = async (req, res, next) => {
    this.logger.debug('executing #getAsset handler');

    try {
      return res.status(httpStatus.OK).json(await this.manager.getAsset(req.params.assetName, req.params.version));
    } catch (error) {
      if (error instanceof AssetNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }
  };

  public upsertAsset: UpsertAssetHandler = async (req, res, next) => {
    this.logger.debug('executing #upsertAsset handler');

    try {
      const createdAsset = await this.manager.upsertAsset(req.body);

      const returnStatus = createdAsset.version === 1 ? httpStatus.CREATED : httpStatus.OK;
      return res.status(returnStatus).json(createdAsset);
    } catch (error) {
      if (error instanceof AssetVersionMismatchError) {
        (error as HttpError).status = httpStatus.CONFLICT;
      }
      return next(error);
    }
  };
}
