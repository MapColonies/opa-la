import httpStatus from 'http-status-codes';
import { formatDate } from 'date-fns';
import { injectable, inject } from 'tsyringe';
import { RequestHandler } from 'express';
import type { Logger } from '@map-colonies/js-logger';
import { SERVICES } from '@common/constants';
import { type ConfigType } from '@src/common/config';
import { AuthManager } from '@src/auth/model/authManager';
import { UserIsBannedError } from '@src/tokens/models/errors';
import { QlrManager } from '../models/qlrManager';

@injectable()
export class QlrController {
  public constructor(
    @inject(SERVICES.CONFIG) private readonly config: ConfigType,
    @inject(QlrManager) private readonly qlrManager: QlrManager,
    @inject(AuthManager) private readonly authManager: AuthManager,
    @inject(SERVICES.LOGGER) private readonly logger: Logger
  ) {}

  public getQlr: RequestHandler = async (req, res, next) => {
    try {
      const userId = req.oidc.user?.[this.authManager.getIdKey()] as string | undefined;

      if (req.oidc.user === undefined || userId === undefined) {
        this.logger.warn('User ID not found in request', { user: req.oidc.user });
        return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });
      }

      const qlr = await this.qlrManager.getQlr(userId, req.oidc.user);

      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="mapcolonies-layers-${formatDate(new Date(), 'yyyy-MM-dd')}.qlr"`);
      res.status(httpStatus.OK).send(qlr);
    } catch (error) {
      if (error instanceof UserIsBannedError) {
        return res.status(httpStatus.FORBIDDEN).json({
          message: 'user is banned',
        });
      }
      next(error);
    }
  };
}
