import { HttpError } from '@map-colonies/error-express-handler';
import { IBundle } from 'auth-core';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { BundleSearchParams } from '../models/bundle';

import { BundleManager } from '../models/bundleManager';
import { BundleNotFoundError } from '../models/errors';

type GetBundles = RequestHandler<undefined, IBundle[], undefined, BundleSearchParams>;
type GetBundle = RequestHandler<{ id: number }, IBundle>;

@injectable()
export class BundleController {
  public constructor(@inject(BundleManager) private readonly manager: BundleManager) {}

  public getBundles: GetBundles = async (req, res, next) => {
    try {
      return res.status(httpStatus.OK).json(await this.manager.getBundles(req.query));
    } catch (error) {
      return next(error);
    }
  };

  public getBundle: GetBundle = async (req, res, next) => {
    try {
      return res.status(httpStatus.OK).json(await this.manager.getBundle(req.params.id));
    } catch (error) {
      if (error instanceof BundleNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }
  };
}
