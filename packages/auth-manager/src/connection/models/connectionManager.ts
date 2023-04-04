import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { ArrayContains, ArrayOverlap } from 'typeorm';
import { Client } from '../../client/models/client';
import { ClientNotFoundError } from '../../client/models/errors';
import { Environment, SERVICES } from '../../common/constants';
import { ConnectionRepository } from '../DAL/connectionRepository';
import { ConnectionSearchParams, IConnection } from './connection';
import { ConnectionVersionMismatchError, ConnectionNotFoundError } from './errors';

@injectable()
export class ConnectionManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONNECTION_REPOSITORY) private readonly connectionRepository: ConnectionRepository
  ) {}

  public async getConnections(searchParams: ConnectionSearchParams): Promise<IConnection[]> {
    this.logger.info({ msg: 'fetching connections', searchParams });
    const { environment, domains, isEnabled, isNoBrowser, isNoOrigin, name } = searchParams;
    return this.connectionRepository.find({
      where: {
        environment: environment ? ArrayOverlap(environment) : undefined,
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
      const transactionRepo = transactionManager.withRepository(this.connectionRepository);

      const client = await transactionManager.getRepository(Client).findOneBy({ name: connection.name });

      if (client === null) {
        throw new ClientNotFoundError('no client exists with given name');
      }

      const maxVersion = await transactionRepo.getMaxVersionWithLock(connection.name, connection.environment);

      if (maxVersion === null) {
        if (connection.version !== 1) {
          const msg = 'given connection version is not 1, when no connection already exists';
          this.logger.debug({ msg, clientConnectionVersion: connection.version });
          throw new ConnectionVersionMismatchError(msg);
        }
        this.logger.info({ msg: 'creating new connection', connection: { clientName: connection.name, environment: connection.environment } });
        // insert
        return transactionRepo.save(connection);
      }

      if (maxVersion !== connection.version) {
        const msg = 'version mismatch between database connection and given connection';
        this.logger.debug({ msg, connection: { clientVersion: connection.version, dbVersion: maxVersion } });

        throw new ConnectionVersionMismatchError(msg);
      }

      this.logger.info({ msg: 'updating existing connection', connection: { clientName: connection.name, environment: connection.environment } });
      // update
      return transactionRepo.save({ ...connection, version: maxVersion + 1 });
    });
  }
}
