import httpStatus from 'http-status-codes';
import { formatDate } from 'date-fns';
import { injectable, inject } from 'tsyringe';
import type { Logger } from '@map-colonies/js-logger';
import { TypedRequestHandlers } from '@src/openapi';
import { SERVICES } from '@common/constants';
import { type ConfigType } from '@src/common/config';
import { AuthManager } from '@src/auth/model/authManager';
import { UserIsBannedError } from '@src/users/errors';
import { FileManager } from '../models/fileManager';

@injectable()
export class FileController {
  public constructor(
    @inject(SERVICES.CONFIG) private readonly config: ConfigType,
    @inject(FileManager) private readonly fileManager: FileManager,
    @inject(AuthManager) private readonly authManager: AuthManager,
    @inject(SERVICES.LOGGER) private readonly logger: Logger
  ) {}

  public getFile: TypedRequestHandlers['GET /files/{type}'] = async (req, res, next) => {
    try {
      const userId = req.oidc.user?.[this.authManager.getIdKey()] as string | undefined;

      if (req.oidc.user === undefined || userId === undefined) {
        this.logger.warn('User ID not found in request', { user: req.oidc.user });
        return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });
      }

      const file = await this.fileManager.getFile(req.params.type, userId, req.oidc.user);

      const dateString = formatDate(new Date(), 'yyyy-MM-dd');
      if (req.params.type === 'qlr') {
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename="mapcolonies-layers-${dateString}.qlr"`);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="mapcolonies-layers-${dateString}.lyrx"`);
      }

      res.status(httpStatus.OK).send(file);
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
