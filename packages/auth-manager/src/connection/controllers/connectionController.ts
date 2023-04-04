import { HttpError } from '@map-colonies/error-express-handler';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { ConnectionSearchParams, IConnection } from '../models/connection';
import { ConnectionManager } from '../models/connectionManager';
import { ConnectionNotFoundError, ConnectionVersionMismatchError } from '../models/errors';
import { Environment, SERVICES } from '../../common/constants';
import { ClientNotFoundError } from '../../client/models/errors';

interface ConnectionNamePathParams {
  clientName: string;
}

type EnvConnectionPathParams = {
  environment: Environment;
} & ConnectionNamePathParams;

type UpsertConnectionHandler = RequestHandler<undefined, IConnection, IConnection>;
type GetConnectionsHandler = RequestHandler<undefined, IConnection[], undefined, ConnectionSearchParams>;
type GetNamedConnectionsHandler = RequestHandler<ConnectionNamePathParams, IConnection[]>;
type GetNamedEnvConnectionsHandler = RequestHandler<EnvConnectionPathParams, IConnection[]>;
type GetConnectionHandler = RequestHandler<EnvConnectionPathParams & { version: number }, IConnection>;

@injectable()
export class ConnectionController {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(ConnectionManager) private readonly manager: ConnectionManager
  ) {}

  public getConnections: GetConnectionsHandler = async (req, res, next) => {
    this.logger.debug('executing #getConnections handler');

    try {
      return res.status(httpStatus.OK).json(await this.manager.getConnections(req.query));
    } catch (error) {
      return next(error);
    }
  };

  public getNamedConnections: GetNamedConnectionsHandler = async (req, res, next) => {
    this.logger.debug('executing #getNamedConnections handler');

    try {
      return res.status(httpStatus.OK).json(await this.manager.getConnections({ name: req.params.clientName }));
    } catch (error) {
      return next(error);
    }
  };

  public getNamedEnvConnections: GetNamedEnvConnectionsHandler = async (req, res, next) => {
    this.logger.debug('executing #getNamedEnvConnections handler');

    try {
      return res
        .status(httpStatus.OK)
        .json(await this.manager.getConnections({ name: req.params.clientName, environment: [req.params.environment] }));
    } catch (error) {
      return next(error);
    }
  };

  public getConnection: GetConnectionHandler = async (req, res, next) => {
    this.logger.debug('executing #getConnection handler');

    try {
      return res.status(httpStatus.OK).json(await this.manager.getConnection(req.params.clientName, req.params.environment, req.params.version));
    } catch (error) {
      if (error instanceof ConnectionNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }
  };

  public upsertConnection: UpsertConnectionHandler = async (req, res, next) => {
    this.logger.debug('executing #upsertConnection handler');

    try {
      const createdConnection = await this.manager.upsertConnection(req.body);

      const returnStatus = createdConnection.version === 1 ? httpStatus.CREATED : httpStatus.OK;
      return res.status(returnStatus).json(createdConnection);
    } catch (error) {
      if (error instanceof ClientNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }

      if (error instanceof ConnectionVersionMismatchError) {
        (error as HttpError).status = httpStatus.CONFLICT;
      }
      return next(error);
    }
  };
}
