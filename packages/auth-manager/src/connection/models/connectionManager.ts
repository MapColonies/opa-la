import { type Logger } from '@map-colonies/js-logger';
import { Client, Connection, Environments, IConnection } from '@map-colonies/auth-core';
import { inject, injectable } from 'tsyringe';
import { ArrayContains, FindManyOptions, In, ILike } from 'typeorm';
import { JWK } from 'jose';
import { ClientNotFoundError } from '@client/models/errors';
import { SERVICES } from '@common/constants';
import { type DomainRepository } from '@domain/DAL/domainRepository';
import { DomainNotFoundError } from '@domain/models/errors';
import { type KeyRepository } from '@key/DAL/keyRepository';
import { generateToken } from '@common/crypto';
import { PaginationParams, paginationParamsToFindOptions } from '@src/common/db/pagination';
import { KeyNotFoundError } from '@key/models/errors';
import { SortOptions } from '@src/common/db/sort';
import { asteriskStringComparatorLast } from '@src/utils/utils';
import { paths } from '@src/openapi';
import { type ConnectionRepository } from '../DAL/connectionRepository';
import { ConnectionVersionMismatchError, ConnectionNotFoundError } from './errors';

@injectable()
export class ConnectionManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONNECTION_REPOSITORY) private readonly connectionRepository: ConnectionRepository,
    @inject(SERVICES.DOMAIN_REPOSITORY) private readonly domainRepository: DomainRepository,
    @inject(SERVICES.KEY_REPOSITORY) private readonly keyRepository: KeyRepository
  ) {}

  public async getConnections(
    searchParams: paths['/connection']['get']['parameters']['query'],
    paginationParams?: PaginationParams,
    sortParams?: SortOptions<Connection>
  ): Promise<[IConnection[], number]> {
    this.logger.info({ msg: 'fetching connections', searchParams });

    if (searchParams?.isLatestOnly === true) {
      return this.getLatestConnections(searchParams, paginationParams, sortParams);
    }

    const findOptions: FindManyOptions<Connection> = {
      where: {
        name: searchParams?.name !== undefined ? ILike(`%${searchParams.name}%`) : undefined,
        environment: searchParams?.environment ? In(searchParams.environment) : undefined,
        allowNoBrowserConnection: searchParams?.isNoBrowser ?? undefined,
        allowNoOriginConnection: searchParams?.isNoOrigin ?? undefined,
        domains: searchParams?.domains ? ArrayContains(searchParams.domains) : undefined,
        enabled: searchParams?.isEnabled ?? undefined,
      },
    };

    if (paginationParams !== undefined) {
      Object.assign(findOptions, paginationParamsToFindOptions(paginationParams));
    }

    if (sortParams !== undefined) {
      findOptions.order = sortParams;
    }

    return this.connectionRepository.findAndCount(findOptions);
  }

  public async getConnection(name: string, environment: Environments, version: number): Promise<IConnection> {
    this.logger.info({ msg: 'fetching connection', connection: { name, version, environment } });

    const connection = await this.connectionRepository.findOne({ where: { name, version } });

    if (connection === null) {
      this.logger.debug('connection was not found in the database');
      throw new ConnectionNotFoundError('connection was not found in the database');
    }
    return connection;
  }

  public async getLatestConnection(name: string, environment: Environments): Promise<IConnection> {
    this.logger.info({ msg: 'fetching latest connection', connection: { name, environment } });
    const version = await this.connectionRepository.getMaxVersion(name, environment);

    if (version === null) {
      this.logger.debug('latest connection was not found in the database');
      throw new ConnectionNotFoundError('latest connection was not found in the database');
    }
    return this.getConnection(name, environment, version);
  }

  public async upsertConnection(connection: IConnection, ignoreTokenErrors = false): Promise<IConnection> {
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

      connection.token = await this.handleToken(connection, transactionManager.withRepository(this.keyRepository), !ignoreTokenErrors);

      const maxVersion = await connectionRepo.getMaxVersionWithLock(connection.name, connection.environment);
      connection.origins = connection.origins.sort(asteriskStringComparatorLast());

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

  private async handleToken(connection: IConnection, transactionKeyRepo: KeyRepository, throwOnError?: boolean): Promise<string> {
    if (connection.token !== '') {
      return connection.token;
    }

    const key = (await transactionKeyRepo.getLatestKeys()).find((key) => key.environment === connection.environment);

    if (key?.privateKey === undefined) {
      this.logger.warn({
        msg: 'no private key found for connection, could not create token',
        connection: { name: connection.name, environment: connection.environment },
      });
      if (throwOnError === true) {
        throw new KeyNotFoundError('no private key found for connection, could not create token');
      }
      return '';
    }

    try {
      return await generateToken(key.privateKey as JWK, connection.name, key.privateKey.kid);
    } catch (error) {
      this.logger.error({ msg: 'could not generate token', error });
      if (throwOnError === true) {
        throw error;
      }
      return '';
    }
  }

  private async getLatestConnections(
    searchParams: paths['/connection']['get']['parameters']['query'],
    paginationParams?: PaginationParams,
    sortParams?: SortOptions<Connection>
  ): Promise<[IConnection[], number]> {
    const countQueryBuilder = this.connectionRepository.createQueryBuilder('connection');
    countQueryBuilder.select('COUNT(DISTINCT (connection.name, connection.environment))', 'count');

    if (searchParams?.name !== undefined) {
      countQueryBuilder.andWhere('connection.name ILIKE :name', { name: `%${searchParams.name}%` });
    }

    if (searchParams?.environment !== undefined) {
      countQueryBuilder.andWhere('connection.environment IN (:...environment)', { environment: searchParams.environment });
    }

    if (searchParams?.isEnabled !== undefined) {
      countQueryBuilder.andWhere('connection.enabled = :isEnabled', { isEnabled: searchParams.isEnabled });
    }

    if (searchParams?.isNoBrowser !== undefined) {
      countQueryBuilder.andWhere('connection.allowNoBrowserConnection = :isNoBrowser', { isNoBrowser: searchParams.isNoBrowser });
    }

    if (searchParams?.isNoOrigin !== undefined) {
      countQueryBuilder.andWhere('connection.allowNoOriginConnection = :isNoOrigin', { isNoOrigin: searchParams.isNoOrigin });
    }

    if (searchParams?.domains !== undefined) {
      countQueryBuilder.andWhere('connection.domains @> :domains', { domains: searchParams.domains });
    }

    const countResult = await countQueryBuilder.getRawOne<{ count: string }>();
    const total = parseInt(countResult?.count ?? '0', 10);

    const queryBuilder = this.connectionRepository.createQueryBuilder('connection');

    queryBuilder.distinctOn(['connection.name', 'connection.environment']);

    const nameOrder = sortParams?.name ? (sortParams.name.toUpperCase() as 'ASC' | 'DESC') : 'ASC';
    const environmentOrder = sortParams?.environment ? (sortParams.environment.toUpperCase() as 'ASC' | 'DESC') : 'ASC';

    queryBuilder.orderBy('connection.name', nameOrder).addOrderBy('connection.environment', environmentOrder);

    if (sortParams !== undefined && Object.keys(sortParams).length > 0) {
      for (const [key, order] of Object.entries(sortParams)) {
        if (key !== 'name' && key !== 'environment') {
          queryBuilder.addOrderBy(`connection.${key}`, order.toUpperCase() as 'ASC' | 'DESC');
        }
      }
    }

    queryBuilder.addOrderBy('connection.version', 'DESC');

    if (searchParams?.name !== undefined) {
      queryBuilder.andWhere('connection.name ILIKE :name', { name: `%${searchParams.name}%` });
    }

    if (searchParams?.environment !== undefined) {
      queryBuilder.andWhere('connection.environment IN (:...environment)', { environment: searchParams.environment });
    }

    if (searchParams?.isEnabled !== undefined) {
      queryBuilder.andWhere('connection.enabled = :isEnabled', { isEnabled: searchParams.isEnabled });
    }

    if (searchParams?.isNoBrowser !== undefined) {
      queryBuilder.andWhere('connection.allowNoBrowserConnection = :isNoBrowser', { isNoBrowser: searchParams.isNoBrowser });
    }

    if (searchParams?.isNoOrigin !== undefined) {
      queryBuilder.andWhere('connection.allowNoOriginConnection = :isNoOrigin', { isNoOrigin: searchParams.isNoOrigin });
    }

    if (searchParams?.domains !== undefined) {
      queryBuilder.andWhere('connection.domains @> :domains', { domains: searchParams.domains });
    }

    if (paginationParams !== undefined) {
      const { skip, take } = paginationParamsToFindOptions(paginationParams);
      if (skip !== undefined) {
        queryBuilder.skip(skip);
      }
      if (take !== undefined) {
        queryBuilder.take(take);
      }
    }

    const results = await queryBuilder.getMany();

    return [results, total];
  }
}
