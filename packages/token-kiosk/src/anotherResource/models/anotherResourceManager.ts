import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { components } from '@src/openapi';
import { SERVICES } from '@common/constants';

const resourceInstance: IAnotherResourceModel = {
  kind: 'avi',
  isAlive: false,
};

export type IAnotherResourceModel = components['schemas']['anotherResource'];

@injectable()
export class AnotherResourceManager {
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger) {}
  public getResource(): IAnotherResourceModel {
    this.logger.info('logging');
    return resourceInstance;
  }
}
