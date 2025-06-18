import { HttpError } from '@map-colonies/error-express-handler';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { Domain } from '@map-colonies/auth-core';
import type { TypedRequestHandlers } from '@openapi';
import { sortOptionParser } from '@src/common/db/sort';
import { DEFAULT_PAGE_SIZE } from '@src/common/db/pagination';
import { DomainManager } from '../models/domainManager';
import { DomainAlreadyExistsError } from '../models/errors';

const domainSortMap = new Map<string, keyof Domain>(
  Object.entries({
    domain: 'name',
  })
);

@injectable()
export class DomainController {
  public constructor(@inject(DomainManager) private readonly manager: DomainManager) {}

  public getDomains: TypedRequestHandlers['getDomains'] = async (req, res, next) => {
    try {
      const paginationParams = {
        /* istanbul ignore next */
        page: req.query?.page ?? 1,
        /* istanbul ignore next */
        pageSize: req.query?.page_size ?? DEFAULT_PAGE_SIZE,
      };

      /* istanbul ignore next */
      const sortParams = sortOptionParser(req.query?.sort, domainSortMap);

      const [domains, count] = await this.manager.getDomains(paginationParams, sortParams);

      return res.status(httpStatus.OK).json({ items: domains, total: count });
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
