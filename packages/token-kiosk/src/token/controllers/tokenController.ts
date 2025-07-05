import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES } from '@common/constants';

import { TokenManager } from '../models/tokenManager';

@injectable()
export class TokenController {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(TokenManager) private readonly manager: TokenManager
  ) {}

  public getToken: TypedRequestHandlers['getToken'] = async (req, res, next) => {
    this.logger.debug('Received request to get token', {
      user: req.oidc.user,
      idToken: req.oidc.idToken,
    });

    try {
      const token = await this.manager.getToken(req.oidc.idToken as string);

      // We know the user is authenticated at this point because of the OIDC middleware, so we can safely access req.oidc.idToken
      return res.status(httpStatus.OK).json(token);
    } catch (error) {
      this.logger.error('Error while getting token', { error });
      return next(error);
    }
  };
}
