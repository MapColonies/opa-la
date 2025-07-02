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
    const email = req.oidc.user?.email as string;

    this.logger.debug('Received request to get token', {
      user: email,
    });

    try {
      const token = await this.manager.getToken(email);

      // We know the user is authenticated at this point because of the OIDC middleware, so we can safely access req.oidc.idToken
      return res.status(httpStatus.OK).json(token);
    } catch (error) {
      this.logger.error('Error while getting token', { error });
      return next(error);
    }
  };
}
