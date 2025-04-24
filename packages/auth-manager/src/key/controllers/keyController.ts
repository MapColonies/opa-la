import { HttpError } from '@map-colonies/error-express-handler';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { type Logger } from '@map-colonies/js-logger';
import type { TypedRequestHandlers, components } from '@openapi';
import { SERVICES } from '@common/constants';
import { KeyManager } from '../models/keyManager';
import { KeyNotFoundError, KeyVersionMismatchError } from '../models/errors';

@injectable()
export class KeyController {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(KeyManager) private readonly manager: KeyManager
  ) {}

  public getLatestKeys: TypedRequestHandlers['getLastestKeys'] = async (req, res, next) => {
    this.logger.debug('executing #getLatestKeys handler');

    try {
      const keys = await this.manager.getLatestKeys();
      return res.status(httpStatus.OK).json(keys);
    } catch (error) {
      return next(error);
    }
  };

  public getKeys: TypedRequestHandlers['getKeys'] = async (req, res, next) => {
    this.logger.debug('executing #getKeys handler');

    try {
      const keys = await this.manager.getEnvKeys(req.params.environment);
      return res.status(httpStatus.OK).json(keys);
    } catch (error) {
      return next(error);
    }
  };

  public getKey: TypedRequestHandlers['getSpecificKey'] = async (req, res, next) => {
    this.logger.debug('executing #getKey handler');

    try {
      const key = await this.manager.getKey(req.params.environment, req.params.version);
      return res.status(httpStatus.OK).json(key);
    } catch (error) {
      if (error instanceof KeyNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }
  };

  public upsertKey: TypedRequestHandlers['upsertKey'] = async (req, res, next) => {
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
