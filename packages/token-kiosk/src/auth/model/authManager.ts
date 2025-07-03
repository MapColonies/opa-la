import { inject, injectable } from 'tsyringe';
import { type Logger } from '@map-colonies/js-logger';
import { type ConfigType } from '@src/common/config';
import { SERVICES } from '@src/common/constants';

@injectable()
export class AuthManager {
  public constructor(
    @inject(SERVICES.CONFIG) private readonly config: ConfigType,
    @inject(SERVICES.LOGGER) private readonly logger: Logger
  ) {}

  public getIdKey(): string {
    return this.config.get('auth.openid.idField');
  }

  public metadataFieldsPicker(userData: Record<string, unknown>): Record<string, unknown> {
    const metadataFields = this.config.get('auth.openid.metadataFields') as string[];
    const result: Record<string, unknown> = {};

    for (const field of metadataFields) {
      if (field in userData) {
        result[field] = userData[field];
      } else {
        this.logger.warn(`Field '${field}' does not exist in userData`);
      }
    }

    return result;
  }
}
