import { HttpError } from '@map-colonies/error-express-handler';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { type Logger } from '@map-colonies/js-logger';
import { IConnection } from '@map-colonies/auth-core';
import type { TypedRequestHandlers, components } from '@openapi';
import { SERVICES } from '@common/constants';
import { ClientNotFoundError } from '@client/models/errors';
import { DEFAULT_PAGE_SIZE } from '@src/common/db/pagination';
import { DomainNotFoundError } from '@domain/models/errors';
import { sortOptionParser } from '@src/common/db/sort';
import { KeyNotFoundError } from '@key/models/errors';
import { ConnectionManager } from '../models/connectionManager';
import { ConnectionNotFoundError, ConnectionVersionMismatchError } from '../models/errors';

function responseConnectionToOpenApi(connection: IConnection): components['schemas']['connection'] {
  return {
    ...connection,
    createdAt: connection.createdAt?.toISOString(),
  };
}

const connectionSortMap = new Map<string, keyof IConnection>([
  ['name', 'name'],
  ['environment', 'environment'],
  ['version', 'version'],
  ['created-at', 'createdAt'],
  ['enabled', 'enabled'],
]);

@injectable()
export class ConnectionController {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(ConnectionManager) private readonly manager: ConnectionManager
  ) {}

  public getConnections: TypedRequestHandlers['getConnections'] = async (req, res, next) => {
    this.logger.debug('executing #getConnections handler');

    const paginationParams = {
      /* istanbul ignore next */
      page: req.query?.page ?? 1,
      /* istanbul ignore next */
      pageSize: req.query?.page_size ?? DEFAULT_PAGE_SIZE,
    };

    /* istanbul ignore next */
    const sortParams = sortOptionParser(req.query?.sort, connectionSortMap);

    try {
      const [connections, count] = await this.manager.getConnections(req.query, paginationParams, sortParams);

      return res.status(httpStatus.OK).json({ total: count, items: connections.map(responseConnectionToOpenApi) });
    } catch (error) {
      return next(error);
    }
  };

  public getNamedConnections: TypedRequestHandlers['getClientConnections'] = async (req, res, next) => {
    this.logger.debug('executing #getNamedConnections handler');

    try {
      const [connections] = await this.manager.getConnections({ name: req.params.clientName });
      return res.status(httpStatus.OK).json(connections.map(responseConnectionToOpenApi));
    } catch (error) {
      return next(error);
    }
  };

  public getNamedEnvConnections: TypedRequestHandlers['getClientEnvironmentConnections'] = async (req, res, next) => {
    this.logger.debug('executing #getNamedEnvConnections handler');

    try {
      const [connections] = await this.manager.getConnections({ name: req.params.clientName, environment: [req.params.environment] });

      return res.status(httpStatus.OK).json(connections.map(responseConnectionToOpenApi));
    } catch (error) {
      return next(error);
    }
  };

  public getConnection: TypedRequestHandlers['getClientVersionedConnection'] = async (req, res, next) => {
    this.logger.debug('executing #getConnection handler');

    try {
      const connection = await this.manager.getConnection(req.params.clientName, req.params.environment, req.params.version);
      return res.status(httpStatus.OK).json(responseConnectionToOpenApi(connection));
    } catch (error) {
      if (error instanceof ConnectionNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }
  };

  public getLatestConnection: TypedRequestHandlers['getClientLatestConnection'] = async (req, res, next) => {
    this.logger.debug('executing #getLatestConnection handler');

    try {
      const connection = await this.manager.getLatestConnection(req.params.clientName, req.params.environment);
      return res.status(httpStatus.OK).json(responseConnectionToOpenApi(connection));
    } catch (error) {
      if (error instanceof ConnectionNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }
  };

  public upsertConnection: TypedRequestHandlers['upsertConnection'] = async (req, res, next) => {
    this.logger.debug('executing #upsertConnection handler');

    try {
      const reqConnection = { ...req.body, createdAt: req.body.createdAt !== undefined ? new Date(req.body.createdAt) : undefined };
      const createdConnection = await this.manager.upsertConnection(reqConnection, req.query?.shouldIgnoreTokenErrors);

      const returnStatus = createdConnection.version === 1 ? httpStatus.CREATED : httpStatus.OK;
      return res.status(returnStatus).json(responseConnectionToOpenApi(createdConnection));
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
      switch (true) {
        case error instanceof KeyNotFoundError:
          (error as HttpError).status = httpStatus.BAD_REQUEST;
          break;
        case error instanceof DomainNotFoundError:
          (error as HttpError).status = httpStatus.BAD_REQUEST;
          break;
        case error instanceof ClientNotFoundError:
          (error as HttpError).status = httpStatus.NOT_FOUND;
          break;
        case error instanceof ConnectionVersionMismatchError:
          (error as HttpError).status = httpStatus.CONFLICT;
          break;
      }

      return next(error);
    }
  };
}
