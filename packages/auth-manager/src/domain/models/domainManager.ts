import { type Logger } from '@map-colonies/js-logger';
import { Domain, IDomain } from '@map-colonies/auth-core';
import { inject, injectable } from 'tsyringe';
import { FindManyOptions } from 'typeorm';
import { PaginationParams, paginationParamsToFindOptions } from '@src/common/db/pagination';
import { SortOptions } from '@src/common/db/sort';
import { SERVICES } from '@common/constants';
import { type DomainRepository } from '../DAL/domainRepository';
import { DomainAlreadyExistsError } from './errors';

@injectable()
export class DomainManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.DOMAIN_REPOSITORY) private readonly domainRepository: DomainRepository
  ) {}

  public async getDomains(paginationParams?: PaginationParams, sortParams?: SortOptions<Domain>): Promise<[IDomain[], number]> {
    this.logger.info({ msg: 'fetching domains' });

    let findOptions: FindManyOptions<Domain> = {
      where: {},
    };
    if (paginationParams !== undefined) {
      findOptions = paginationParamsToFindOptions(paginationParams);
    }

    if (sortParams !== undefined) {
      findOptions.order = sortParams;
    }

    return this.domainRepository.findAndCount(findOptions);
  }

  public async createDomain(domain: IDomain): Promise<IDomain> {
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
