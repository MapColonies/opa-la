import { type Logger } from '@map-colonies/js-logger';
import type { Bundle, Drizzle } from '@map-colonies/auth-core';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '@common/constants';
import { BundleSearchParams } from './bundle';
import { BundleNotFoundError } from './errors';

@injectable()
export class BundleManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.DRIZZLE) private readonly drizzle: Drizzle
  ) {}

  public async getBundles(searchParams: BundleSearchParams): Promise<Bundle[]> {
    this.logger.info({ msg: 'fetching bundles' });
    this.logger.debug({ msg: 'search parameters', searchParams });

    const { createdAfter, createdBefore, environment } = searchParams;

    return this.drizzle.query.bundle.findMany({
      where: {
        environment: environment ? { in: environment } : undefined,
        createdAt: { gte: createdAfter, lte: createdBefore },
      },
    });
  }

  public async getBundle(id: number): Promise<Bundle> {
    this.logger.info({ msg: 'fetching bundle', id });

    const bundle = await this.drizzle.query.bundle.findFirst({ where: { id } });

    if (bundle === undefined) {
      this.logger.debug('bundle was not found in the database');
      throw new BundleNotFoundError('bundle was not found in the database');
    }
    return bundle;
  }
}
