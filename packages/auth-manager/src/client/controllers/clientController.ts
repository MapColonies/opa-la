import { HttpError } from '@map-colonies/error-express-handler';
import { Logger } from '@map-colonies/js-logger';
import { IClient } from 'auth-core';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import { ClientSearchParams } from '../models/client';
import { ClientManager } from '../models/clientManager';
import { ClientAlreadyExistsError, ClientNotFoundError } from '../models/errors';

type CreateClientHandler = RequestHandler<undefined, IClient, IClient>;
type UpdateClientHandler = RequestHandler<ClientNameParam, Omit<IClient, 'name'>, IClient>;
type GetClientsHandler = RequestHandler<undefined, IClient[], undefined, ClientSearchParams>;
type GetClientHandler = RequestHandler<ClientNameParam, IClient>;

export interface ClientNameParam {
  clientName: string;
}

@injectable()
export class ClientController {
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger, @inject(ClientManager) private readonly manager: ClientManager) {}

  public getClients: GetClientsHandler = async (req, res, next) => {
    try {
      this.logger.debug('executing #getClients handler');

      const clients = await this.manager.getClients(req.query);

      res.json(clients);
    } catch (error) {
      next(error);
    }
  };

  public getClient: GetClientHandler = async (req, res, next) => {
    try {
      this.logger.debug('executing #getClient handler');

      const client = await this.manager.getClient(req.params.clientName);
      return res.json(client);
    } catch (error) {
      if (error instanceof ClientNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }
  };

  public createClient: CreateClientHandler = async (req, res, next) => {
    try {
      this.logger.debug('executing #createClient handler');

      const createdDomain = await this.manager.createClient(req.body);
      return res.status(httpStatus.CREATED).json(createdDomain);
    } catch (error) {
      if (error instanceof ClientAlreadyExistsError) {
        (error as HttpError).status = httpStatus.CONFLICT;
      }
      return next(error);
    }
  };

  public updateClient: UpdateClientHandler = async (req, res, next) => {
    try {
      this.logger.debug('executing #updateClient handler');

      const createdDomain = await this.manager.updateClient(req.params.clientName, req.body);
      return res.json(createdDomain);
    } catch (error) {
      if (error instanceof ClientNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }
  };
}
