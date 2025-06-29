import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import type { components } from '@openapi';
import { SERVICES } from '@common/constants';

export type IResourceNameModel = components['schemas']['resource'];

@injectable()
export class TokenManager {
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger) {}

  public getResource(): IResourceNameModel {
    this.logger.info({ msg: 'getting resource', resourceId: resourceInstance.id });

    return resourceInstance;
  }

  public createResource(resource: IResourceNameModel): IResourceNameModel {
    const resourceId = generateRandomId();

    this.logger.info({ msg: 'creating resource', resourceId });

    return { ...resource, id: resourceId };
  }
}
