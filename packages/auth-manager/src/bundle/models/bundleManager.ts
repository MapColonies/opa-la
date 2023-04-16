import { Logger } from '@map-colonies/js-logger';
import { Bundle, IBundle } from '@map-colonies/auth-core';
import { inject, injectable } from 'tsyringe';
import { In, Repository } from 'typeorm';
import { SERVICES } from '../../common/constants';
import { createDatesComparison } from '../../common/db/utils';
import { BundleSearchParams } from './bundle';
import { BundleNotFoundError } from './errors';

@injectable()
export class BundleManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.BUNDLE_REPOSITORY) private readonly bundleRepository: Repository<Bundle>
  ) {}

  public async getBundles(searchParams: BundleSearchParams): Promise<IBundle[]> {
    this.logger.info({ msg: 'fetching bundles' });
    this.logger.debug({ msg: 'search parameters', searchParams });

    const { createdAfter, createdBefore, environment } = searchParams;

    return this.bundleRepository.findBy({
      createdAt: createDatesComparison(createdAfter, createdBefore),
      environment: environment ? In(environment) : undefined,
    });
  }

  public async getBundle(id: number): Promise<IBundle> {
    this.logger.info({ msg: 'fetching bundle', id });

    const bundle = await this.bundleRepository.findOneBy({ id });

    if (bundle === null) {
      this.logger.debug('bundle was not found in the database');
      throw new BundleNotFoundError('bundle was not found in the database');
    }
    return bundle;
  }
}
