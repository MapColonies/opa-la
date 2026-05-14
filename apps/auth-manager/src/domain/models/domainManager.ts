import type { Logger } from '@map-colonies/js-logger';
import { Domain, domainTable, type NewDomain, type Drizzle } from '@map-colonies/auth-core';
import { inject, injectable } from 'tsyringe';
import { count } from 'drizzle-orm';
import { type PaginationParams, paginationParamsToOffsetAndLimit } from '@src/common/db/pagination';
import type { SortOptions } from '@src/common/db/sort';
import { SERVICES } from '@common/constants';
import { DomainAlreadyExistsError } from './errors';

@injectable()
export class DomainManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.DRIZZLE) private readonly drizzle: Drizzle
  ) {}

  public async getDomains(paginationParams?: PaginationParams, sortParams?: SortOptions<Domain>): Promise<[Domain[], number]> {
    this.logger.info({ msg: 'fetching domains' });

    let findOptions: Parameters<typeof this.drizzle.query.domain.findMany>[0] = {};
    if (paginationParams !== undefined) {
      findOptions = { ...paginationParamsToOffsetAndLimit(paginationParams) };
    }

    if (sortParams !== undefined) {
      findOptions.orderBy = sortParams;
    }

    const domainsQuery = this.drizzle.query.domain.findMany(findOptions);
    const countQuery = this.drizzle.select({ count: count() }).from(domainTable);

    const result = await Promise.all([domainsQuery, countQuery]);

    return [result[0], result[1][0]?.count ?? 0];
    // return this.domainRepository.findAndCount(findOptions);
  }

  public async createDomain(domain: NewDomain): Promise<Domain> {
    this.logger.info({ msg: 'creating domain', name: domain.name });
    try {
      await this.domainRepository.insert(domain);
      return domain;
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
        throw new DomainAlreadyExistsError('domain already exists');
      }
      throw error;
    }
  }
}
