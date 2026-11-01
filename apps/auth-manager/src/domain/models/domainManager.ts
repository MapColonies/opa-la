import type { Logger } from '@map-colonies/js-logger';
import { connectionTable, Domain, domainTable, type NewDomain, type Drizzle } from '@map-colonies/auth-core';
import { inject, injectable } from 'tsyringe';
import { and, arrayContains, count, eq, notExists } from 'drizzle-orm';
import { isDrizzleQueryError } from '@map-colonies/drizzle-utils';
import { type PaginationParams, paginationParamsToOffsetAndLimit, type SortOptions } from '@map-colonies/drizzle-utils';
import { SERVICES } from '@common/constants';
import { DomainAlreadyExistsError, DomainInUseError, DomainNotFoundError } from './errors';

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
  }

  public async createDomain(domain: NewDomain): Promise<Domain> {
    this.logger.info({ msg: 'creating domain', name: domain.name });
    try {
      await this.drizzle.insert(domainTable).values(domain);
      return domain;
    } catch (error) {
      if (isDrizzleQueryError(error) && (error.cause?.message.includes('duplicate key value violates unique constraint') ?? false)) {
        throw new DomainAlreadyExistsError('domain already exists');
      }
      throw error;
    }
  }

  public async deleteDomain(name: string): Promise<void> {
    this.logger.info({ msg: 'deleting domain', name });
    // a domain is in use if any connection version, in any environment, lists it
    const connectionsUsingDomain = this.drizzle
      .select()
      .from(connectionTable)
      .where(arrayContains(connectionTable.domains, [name]));

    const deleted = await this.drizzle
      .delete(domainTable)
      .where(and(eq(domainTable.name, name), notExists(connectionsUsingDomain)))
      .returning();

    if (deleted.length > 0) {
      return;
    }

    const domain = await this.drizzle.query.domain.findFirst({ where: { name } });

    if (domain === undefined) {
      throw new DomainNotFoundError('domain not found');
    }

    throw new DomainInUseError('domain is in use by connections');
  }
}
