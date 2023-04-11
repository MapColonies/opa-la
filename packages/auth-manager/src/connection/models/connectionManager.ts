import { Logger } from '@map-colonies/js-logger';
import { Client, Environment, IConnection } from 'auth-core';
import { inject, injectable } from 'tsyringe';
import { ArrayContains, In } from 'typeorm';
import { ClientNotFoundError } from '../../client/models/errors';
import { SERVICES } from '../../common/constants';
import { DomainRepository } from '../../domain/DAL/domainRepository';
import { DomainNotFoundError } from '../../domain/models/errors';
import { ConnectionRepository } from '../DAL/connectionRepository';
import { ConnectionSearchParams } from './connection';
import { ConnectionVersionMismatchError, ConnectionNotFoundError } from './errors';

@injectable()
export class ConnectionManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONNECTION_REPOSITORY) private readonly connectionRepository: ConnectionRepository,
    @inject(SERVICES.DOMAIN_REPOSITORY) private readonly domainRepository: DomainRepository
  ) {}

  public async getConnections(searchParams: ConnectionSearchParams): Promise<IConnection[]> {
    this.logger.info({ msg: 'fetching connections', searchParams });
    const { environment, domains, isEnabled, isNoBrowser, isNoOrigin, name } = searchParams;
    return this.connectionRepository.find({
      where: {
        environment: environment ? In(environment) : undefined,
        allowNoBrowserConnection: isNoBrowser ?? undefined,
        allowNoOriginConnection: isNoOrigin ?? undefined,
        name,
        domains: domains ? ArrayContains(domains) : undefined,
        enabled: isEnabled ?? undefined,
      },
      order: { name: 'ASC', environment: 'ASC', version: 'DESC' },
    });
  }

  public async getConnection(name: string, environment: Environment, version: number): Promise<IConnection> {
    this.logger.info({ msg: 'fetching connection', connection: { name, version, environment } });

    const connection = await this.connectionRepository.findOne({ where: { name, version } });

    if (connection === null) {
      this.logger.debug('connection was not found in the database');
      throw new ConnectionNotFoundError('connection was not found in the database');
    }
    return connection;
  }

  public async upsertConnection(connection: IConnection): Promise<IConnection> {
    this.logger.info({ msg: 'upserting connection', connection: { environment: connection.environment, version: connection.version } });
    return this.connectionRepository.manager.transaction(async (transactionManager) => {
      const connectionRepo = transactionManager.withRepository(this.connectionRepository);
      const domainRepo = transactionManager.withRepository(this.domainRepository);

      const client = await transactionManager.getRepository(Client).findOneBy({ name: connection.name });

      if (client === null) {
        throw new ClientNotFoundError('no client exists with given name');
      }

      const notExistingDomains = await domainRepo.checkInputForNonExistingDomains(connection.domains);

      if (notExistingDomains.length > 0) {
        throw new DomainNotFoundError(`the following domains do not exist: ${notExistingDomains.join(', ')}`);
      }

      const maxVersion = await connectionRepo.getMaxVersionWithLock(connection.name, connection.environment);

      if (maxVersion === null) {
        if (connection.version !== 1) {
          const msg = 'given connection version is not 1, when no connection already exists';
          this.logger.debug({ msg, clientConnectionVersion: connection.version });
          throw new ConnectionVersionMismatchError(msg);
        }
        this.logger.info({ msg: 'creating new connection', connection: { clientName: connection.name, environment: connection.environment } });
        // insert
        return connectionRepo.save(connection);
      }

      if (maxVersion !== connection.version) {
        const msg = 'version mismatch between database connection and given connection';
        this.logger.debug({ msg, connection: { clientVersion: connection.version, dbVersion: maxVersion } });

        throw new ConnectionVersionMismatchError(msg);
      }

      this.logger.info({ msg: 'updating existing connection', connection: { clientName: connection.name, environment: connection.environment } });
      // update
      return connectionRepo.save({ ...connection, version: maxVersion + 1 });
    });
  }
}
