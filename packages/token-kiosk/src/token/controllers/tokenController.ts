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

  public getToken: TypedRequestHandlers['getToken'] = (req, res) => {
    return res.status(httpStatus.OK).json(this.manager.getToken());
  };
}
