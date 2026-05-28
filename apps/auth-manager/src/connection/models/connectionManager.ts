import { type Logger } from '@map-colonies/js-logger';
import { type Connection, connectionTable, type DrizzleTx, Environments, type NewConnection, type Drizzle } from '@map-colonies/auth-core';
import { inject, injectable } from 'tsyringe';
import { JWK } from 'jose';
import { paths } from 'auth-openapi';
import { ilike, SQL, inArray, eq, arrayContains, count, and, desc, countDistinct, sql } from 'drizzle-orm';
import { sortOptionsToOrderBy } from '@map-colonies/drizzle-utils';
import { type PaginationParams, type SortOptions, paginationParamsToOffsetAndLimit } from '@map-colonies/drizzle-utils';
import { ClientNotFoundError } from '@client/models/errors';
import { SERVICES } from '@common/constants';
import { DomainRepository } from '@domain/DAL/domainRepository';
import { DomainNotFoundError } from '@domain/models/errors';
import { KeyRepository } from '@key/DAL/keyRepository';
import { generateToken } from '@common/crypto';
import { KeyNotFoundError } from '@key/models/errors';
import { asteriskStringComparatorLast } from '@src/utils/utils';
import { ConnectionRepository } from '../DAL/connectionRepository';
import { ConnectionVersionMismatchError, ConnectionNotFoundError } from './errors';

type ConnectionSearchParams = NonNullable<paths['/connection']['get']['parameters']['query']>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function getSearchFilters(params: ConnectionSearchParams) {
  const filters: SQL[] = [];
  if (params.name !== undefined) {
    filters.push(ilike(connectionTable.name, `%${params.name}%`));
  }
  if (params.environment) {
    filters.push(inArray(connectionTable.environment, params.environment));
  }
  if (params.isNoBrowser !== undefined) {
    filters.push(eq(connectionTable.allowNoBrowserConnection, params.isNoBrowser));
  }
  if (params.isNoOrigin !== undefined) {
    filters.push(eq(connectionTable.allowNoOriginConnection, params.isNoOrigin));
  }
  if (params.domains) {
    filters.push(arrayContains(connectionTable.domains, params.domains));
  }
  if (params.isEnabled !== undefined) {
    filters.push(eq(connectionTable.enabled, params.isEnabled));
  }
  return and(...filters);
}

@injectable()
export class ConnectionManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(ConnectionRepository) private readonly connectionRepository: ConnectionRepository,
    @inject(DomainRepository) private readonly domainRepository: DomainRepository,
    @inject(KeyRepository) private readonly keyRepository: KeyRepository,
    @inject(SERVICES.DRIZZLE) private readonly drizzle: Drizzle
  ) {}

  /**
   * Retrieves a paginated list of connections with optional filtering and sorting.
   * * @remarks
   * **Special Handling for `onlyLatest`:**
   * When `onlyLatest` is true, this method uses Postgres `DISTINCT ON` to return
   * only the most recent version of each connection (grouped by name + environment).
   * This requires a specific sorting strategy and a custom count query.
   *
   * @returns A tuple containing the array of [Connections, TotalCount]
   */
  public async getConnections(
    searchParams: ConnectionSearchParams,
    paginationParams?: PaginationParams,
    sortParams?: SortOptions<Connection>
  ): Promise<[Connection[], number]> {
    this.logger.info({ msg: 'fetching connections', searchParams });
    const filters = getSearchFilters(searchParams);

    const countQuery =
      searchParams.onlyLatest === true
        ? this.drizzle.select({ count: countDistinct(sql`(${connectionTable.name},${connectionTable.environment})`) })
        : this.drizzle.select({ count: count() });

    const countResult = await countQuery.from(connectionTable).where(filters);
    const total = countResult[0]?.count ?? 0;

    const selectQuery =
      searchParams.onlyLatest === true ? this.drizzle.selectDistinctOn([connectionTable.name, connectionTable.environment]) : this.drizzle.select();

    const subQuery = selectQuery
      .from(connectionTable)
      .where(filters)
      .orderBy(connectionTable.name, connectionTable.environment, desc(connectionTable.version))
      .as('sq');

    const { limit, offset } = paginationParamsToOffsetAndLimit(paginationParams);

    const connections = await this.drizzle
      .select()
      .from(subQuery)
      .orderBy(...sortOptionsToOrderBy(subQuery, sortParams ?? {}))
      .limit(limit)
      .offset(offset);

    return [connections, total];
  }

  public async getConnection(name: string, environment: Environments, version: number): Promise<Connection> {
    this.logger.info({ msg: 'fetching connection', connection: { name, version, environment } });

    const connection = await this.drizzle.query.connection.findFirst({ where: { name, version, environment } });

    if (connection === undefined) {
      this.logger.debug('connection was not found in the database');
      throw new ConnectionNotFoundError('connection was not found in the database');
    }
    return connection;
  }

  public async getLatestConnection(name: string, environment: Environments): Promise<Connection> {
    this.logger.info({ msg: 'fetching latest connection', connection: { name, environment } });
    const version = await this.connectionRepository.getMaxVersion(name, environment);

    if (version === null) {
      this.logger.debug('latest connection was not found in the database');
      throw new ConnectionNotFoundError('latest connection was not found in the database');
    }
    return this.getConnection(name, environment, version);
  }

  public async upsertConnection(connection: NewConnection, ignoreTokenErrors = false): Promise<Connection> {
    this.logger.info({ msg: 'upserting connection', connection: { environment: connection.environment, version: connection.version } });

    return this.drizzle.transaction(async (tx) => {
      const client = await tx.query.client.findFirst({ where: { name: connection.name } });

      if (client === undefined) {
        throw new ClientNotFoundError('no client exists with given name');
      }

      const notExistingDomains = await this.domainRepository.checkInputForNonExistingDomains(connection.domains);

      if (notExistingDomains.length > 0) {
        throw new DomainNotFoundError(`the following domains do not exist: ${notExistingDomains.join(', ')}`);
      }

      connection.token = await this.handleToken(connection, tx, !ignoreTokenErrors);

      const maxVersion = await this.connectionRepository.getMaxVersionWithLock(connection.name, connection.environment, tx);
      connection.origins = connection.origins.sort(asteriskStringComparatorLast());

      if (maxVersion === null) {
        if (connection.version !== 1) {
          const msg = 'given connection version is not 1, when no connection already exists';
          this.logger.debug({ msg, clientConnectionVersion: connection.version });
          throw new ConnectionVersionMismatchError(msg);
        }
        this.logger.info({ msg: 'creating new connection', connection: { clientName: connection.name, environment: connection.environment } });

        // insert
        return (await tx.insert(connectionTable).values(connection).returning())[0] as Connection;
      }

      if (maxVersion !== connection.version) {
        const msg = 'version mismatch between database connection and given connection';
        this.logger.debug({ msg, connection: { clientVersion: connection.version, dbVersion: maxVersion } });

        throw new ConnectionVersionMismatchError(msg);
      }

      this.logger.info({ msg: 'updating existing connection', connection: { clientName: connection.name, environment: connection.environment } });
      // update
      return (
        await tx
          .insert(connectionTable)
          .values({ ...connection, version: maxVersion + 1 })
          .returning()
      )[0] as Connection;
    });
  }

  private async handleToken(connection: NewConnection, transaction: DrizzleTx, throwOnError?: boolean): Promise<string> {
    if (connection.token !== '') {
      return connection.token;
    }

    const key = (await this.keyRepository.getLatestKeys(transaction)).find((key) => key.environment === connection.environment);

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
    } catch (err) {
      this.logger.error({ msg: 'could not generate token', err });
      if (throwOnError === true) {
        throw err;
      }
      return '';
    }
  }
}
