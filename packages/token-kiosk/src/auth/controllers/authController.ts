import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES } from '@common/constants';

/**
 * Controller for handling authentication-related endpoints
 */
@injectable()
export class AuthController {
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger) {}

  /**
   * Get current authenticated user information
   */
  public getCurrentUser: TypedRequestHandlers['getCurrentUser'] = async (req, res, next) => {
    try {
      const userInfo = await req.oidc.fetchUserInfo();
      this.logger.info('User info fetched successfully', { userInfo });
      res.status(httpStatus.OK).json(userInfo);
    } catch (error) {
      this.logger.error('Failed to fetch user info', { error });
      next(error);
    }
  };
}
