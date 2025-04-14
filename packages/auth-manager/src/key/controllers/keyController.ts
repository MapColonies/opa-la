import { HttpError } from '@map-colonies/error-express-handler';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { type Logger } from '@map-colonies/js-logger';
import { Environment, IKey } from '@map-colonies/auth-core';
import { KeyManager } from '../models/keyManager';
import { KeyNotFoundError, KeyVersionMismatchError } from '../models/errors';
import { SERVICES } from '../../common/constants';

interface KeyPathParams {
  environment: Environment;
}

type CreateKeyHandler = RequestHandler<undefined, IKey, IKey>;
type GetLatestKeysHandler = RequestHandler<undefined, IKey[]>;
type GetKeysHandler = RequestHandler<KeyPathParams, IKey[]>;
type GetKeyHandler = RequestHandler<KeyPathParams & { version: number }, IKey>;

@injectable()
export class KeyController {
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger, @inject(KeyManager) private readonly manager: KeyManager) {}

  public getLatestKeys: GetLatestKeysHandler = async (req, res, next) => {
    this.logger.debug('executing #getLatestKeys handler');

    try {
      return res.status(httpStatus.OK).json(await this.manager.getLatestKeys());
    } catch (error) {
      return next(error);
    }
  };

  public getKeys: GetKeysHandler = async (req, res, next) => {
    this.logger.debug('executing #getKeys handler');

    try {
      return res.status(httpStatus.OK).json(await this.manager.getEnvKeys(req.params.environment));
    } catch (error) {
      return next(error);
    }
  };

  public getKey: GetKeyHandler = async (req, res, next) => {
    this.logger.debug('executing #getKey handler');

    try {
      return res.status(httpStatus.OK).json(await this.manager.getKey(req.params.environment, req.params.version));
    } catch (error) {
      if (error instanceof KeyNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }
  };

  public upsertKey: CreateKeyHandler = async (req, res, next) => {
    this.logger.debug('executing #upsertKey handler');

    try {
      const createdKey = await this.manager.upsertKey(req.body);

      const returnStatus = createdKey.version === 1 ? httpStatus.CREATED : httpStatus.OK;
      return res.status(returnStatus).json(createdKey);
    } catch (error) {
      if (error instanceof KeyVersionMismatchError) {
        (error as HttpError).status = httpStatus.CONFLICT;
      }
      return next(error);
    }
  };
}
