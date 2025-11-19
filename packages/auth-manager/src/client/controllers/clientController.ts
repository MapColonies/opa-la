import { HttpError } from '@map-colonies/error-express-handler';
import { type Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { IClient } from '@map-colonies/auth-core';
import { parseISO } from 'date-fns';
import type { TypedRequestHandlers, components, operations } from '@openapi';
import { SERVICES } from '@common/constants';
import { DEFAULT_PAGE_SIZE } from '@src/common/db/pagination';
import { sortOptionParser } from '@src/common/db/sort';
import { ClientManager } from '../models/clientManager';
import { ClientAlreadyExistsError, ClientNotFoundError } from '../models/errors';
import { ClientSearchParams } from '../models/client';

function responseClientToOpenApi(client: IClient): components['schemas']['client'] {
  return {
    ...client,
    createdAt: (client.createdAt as Date).toISOString(),
    updatedAt: (client.updatedAt as Date).toISOString(),
  };
}

function queryParamsToSearchParams(query: NonNullable<operations['getClients']['parameters']['query']>): ClientSearchParams {
  const { createdAfter, createdBefore, updatedAfter, updatedBefore, ...rest } = query;
  return {
    ...rest,
    createdAfter: createdAfter !== undefined ? parseISO(createdAfter) : undefined,
    createdBefore: createdBefore !== undefined ? parseISO(createdBefore) : undefined,
    updatedAfter: updatedAfter !== undefined ? parseISO(updatedAfter) : undefined,
    updatedBefore: updatedBefore !== undefined ? parseISO(updatedBefore) : undefined,
  };
}

const clientSortMap = new Map<string, keyof IClient>(
  Object.entries({
    name: 'name',
    branch: 'branch',
    'created-at': 'createdAt',
    'updated-at': 'updatedAt',
    'heb-name': 'hebName',
  })
);

@injectable()
export class ClientController {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(ClientManager) private readonly manager: ClientManager
  ) {}

  public getClients: TypedRequestHandlers['getClients'] = async (req, res, next) => {
    try {
      this.logger.debug({ msg: 'executing #getClients handler', query: req.query });
      const searchParams = queryParamsToSearchParams(req.query ?? {});

      const paginationParams = {
        /* istanbul ignore next */
        page: req.query?.page ?? 1,
        /* istanbul ignore next */
        pageSize: req.query?.page_size ?? DEFAULT_PAGE_SIZE,
      };
      /* istanbul ignore next */
      const sortParams = sortOptionParser(req.query?.sort, clientSortMap);

      const [clients, count] = await this.manager.getClients(searchParams, paginationParams, sortParams);

      return res.status(httpStatus.OK).json({
        total: count,
        items: clients.map((client) => responseClientToOpenApi(client)),
      });
    } catch (error) {
      return next(error);
    }
  };

  public getClient: TypedRequestHandlers['getClient'] = async (req, res, next) => {
    try {
      this.logger.debug('executing #getClient handler');
      const client = await this.manager.getClient(req.params.clientName);
      return res.status(httpStatus.OK).json(responseClientToOpenApi(client));
    } catch (error) {
      if (error instanceof ClientNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }
  };

  public createClient: TypedRequestHandlers['createClient'] = async (req, res, next) => {
    try {
      this.logger.debug('executing #createClient handler');
      const { createdAt, updatedAt, ...reqClient } = req.body;

      const createdClient = await this.manager.createClient(reqClient);
      return res.status(httpStatus.CREATED).json(responseClientToOpenApi(createdClient));
    } catch (error) {
      if (error instanceof ClientAlreadyExistsError) {
        (error as HttpError).status = httpStatus.CONFLICT;
      }
      return next(error);
    }
  };

  public updateClient: TypedRequestHandlers['updateClient'] = async (req, res, next) => {
    try {
      this.logger.debug('executing #updateClient handler');
      const updatedClient = await this.manager.updateClient(req.params.clientName, req.body);
      return res.status(httpStatus.OK).json(responseClientToOpenApi(updatedClient));
    } catch (error) {
      if (error instanceof ClientNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }
  };
}
