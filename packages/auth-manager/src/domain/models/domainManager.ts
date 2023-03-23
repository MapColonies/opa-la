import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { SERVICES } from '../../common/constants';
import { Domain, IDomain } from './domain';
import { DomainAlreadyExistsError } from './errors';

@injectable()
export class DomainManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.DOMAIN_REPOSITORY) private readonly domainRepository: Repository<Domain>
  ) {}

  public async getDomains(): Promise<IDomain[]> {
    this.logger.info({ msg: 'fetching domains' });

    return this.domainRepository.find();
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
