import { HttpError } from '@map-colonies/error-express-handler';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import type { TypedRequestHandlers } from '@openapi';
import { DomainManager } from '../models/domainManager';
import { DomainAlreadyExistsError } from '../models/errors';

@injectable()
export class DomainController {
  public constructor(@inject(DomainManager) private readonly manager: DomainManager) {}

  public getDomains: TypedRequestHandlers['getDomains'] = async (req, res, next) => {
    try {
      return res.status(httpStatus.OK).json(await this.manager.getDomains());
    } catch (error) {
      return next(error);
    }
  };

  public createDomain: TypedRequestHandlers['createDomain'] = async (req, res, next) => {
    try {
      const createdDomain = await this.manager.createDomain(req.body);
      return res.status(httpStatus.CREATED).json(createdDomain);
    } catch (error) {
      if (error instanceof DomainAlreadyExistsError) {
        (error as HttpError).status = httpStatus.CONFLICT;
      }
      return next(error);
    }
  };
}
