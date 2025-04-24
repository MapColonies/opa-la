import { HttpError } from '@map-colonies/error-express-handler';
import { IBundle } from '@map-colonies/auth-core';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import type { TypedRequestHandlers, components } from '@openapi';

import { BundleManager } from '../models/bundleManager';
import { BundleNotFoundError } from '../models/errors';

function responseBundleToOpenApi(bundle: IBundle): components['schemas']['bundle'] {
  return {
    ...bundle,
    createdAt: bundle.createdAt?.toISOString(),
  };
}

@injectable()
export class BundleController {
  public constructor(@inject(BundleManager) private readonly manager: BundleManager) {}

  public getBundles: TypedRequestHandlers['getBundles'] = async (req, res, next) => {
    try {
      const query = req.query ?? {};
      const searchParams = {
        ...query,
        createdBefore: query.createdBefore ? new Date(query.createdBefore) : undefined,
        createdAfter: query.createdAfter ? new Date(query.createdAfter) : undefined,
      };
      const bundles = await this.manager.getBundles(searchParams);
      return res.status(httpStatus.OK).json(bundles.map(responseBundleToOpenApi));
    } catch (error) {
      return next(error);
    }
  };

  public getBundle: TypedRequestHandlers['getBundle'] = async (req, res, next) => {
    try {
      const bundle = await this.manager.getBundle(req.params.id);
      return res.status(httpStatus.OK).json(responseBundleToOpenApi(bundle));
    } catch (error) {
      if (error instanceof BundleNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }
  };
}
