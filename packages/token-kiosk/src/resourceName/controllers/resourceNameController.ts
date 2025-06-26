import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { type Registry, Counter } from 'prom-client';
import type { TypedRequestHandlers } from '@openapi';
import { SERVICES } from '@common/constants';

import { ResourceNameManager } from '../models/resourceNameManager';

@injectable()
export class ResourceNameController {
  private readonly createdResourceCounter: Counter;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(ResourceNameManager) private readonly manager: ResourceNameManager,
    @inject(SERVICES.METRICS) private readonly metricsRegistry: Registry
  ) {
    this.createdResourceCounter = new Counter({
      name: 'created_resource',
      help: 'number of created resources',
      registers: [this.metricsRegistry],
    });
  }

  public getResource: TypedRequestHandlers['getResourceName'] = (req, res) => {
    return res.status(httpStatus.OK).json(this.manager.getResource());
  };

  public createResource: TypedRequestHandlers['POST /resourceName'] = (req, res) => {
    const createdResource = this.manager.createResource(req.body);
    this.createdResourceCounter.inc(1);
    return res.status(httpStatus.CREATED).json(createdResource);
  };
}
