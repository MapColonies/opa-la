import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES } from '@common/constants';
import { type ConfigType } from '@src/common/config';

/**
 * Controller for handling authentication-related endpoints
 */
@injectable()
export class GuidesController {
  public constructor(@inject(SERVICES.CONFIG) private readonly config: ConfigType) {}

  /**
   * Get current authenticated user information
   */
  public getGuides: TypedRequestHandlers['getGuides'] = (req, res) => {
    const guides = this.config.get('guides');

    res.status(httpStatus.OK).json(guides);
  };
}
