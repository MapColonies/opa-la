import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES } from '@common/constants';
import { UserIsBannedError } from '@src/users/errors';
import { AuthManager } from '@src/auth/model/authManager';
import { TokenManager } from '../models/tokenManager';

@injectable()
export class TokenController {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(TokenManager) private readonly manager: TokenManager,
    @inject(AuthManager) private readonly authManager: AuthManager
  ) {}

  public getToken: TypedRequestHandlers['getToken'] = async (req, res, next) => {
    const userId = req.oidc.user?.[this.authManager.getIdKey()] as string | undefined;

    if (req.oidc.user === undefined || userId === undefined) {
      this.logger.warn('User ID not found in request', { user: req.oidc.user });
      return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });
    }

    this.logger.debug('Received request to get token', {
      user: userId,
    });

    try {
      const token = await this.manager.getToken(userId, req.oidc.user);

      // We know the user is authenticated at this point because of the OIDC middleware, so we can safely access req.oidc.idToken
      return res.status(httpStatus.OK).json(token);
    } catch (error) {
      if (error instanceof UserIsBannedError) {
        return res.status(httpStatus.FORBIDDEN).json({
          message: 'user is banned',
        });
      }
      this.logger.error('Error while getting token', { error });
      return next(error);
    }
  };
}
