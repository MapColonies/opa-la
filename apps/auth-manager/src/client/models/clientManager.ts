import { type Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { DatabaseError } from 'pg';
import { count, eq, and, arrayContains, ilike } from 'drizzle-orm';
import { clientTable, type Client, type Drizzle, type NewClient } from '@map-colonies/auth-core';
import { SERVICES } from '@common/constants';
import { pgErrorCodes } from '@common/db/constants';
import { createDatesComparison, isDrizzleQueryError, sortOptionsToOrderBy } from '@common/db/utils';
import { SortOptions } from '@src/common/db/sort';
import { PaginationParams, paginationParamsToOffsetAndLimit } from '@src/common/db/pagination';
import { ClientAlreadyExistsError, ClientNotFoundError } from './errors';
import { ClientSearchParams } from './client';

@injectable()
export class ClientManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.DRIZZLE) private readonly drizzle: Drizzle
  ) {}

  public async getClients(
    searchParams: ClientSearchParams,
    paginationParams?: PaginationParams,
    sortParams?: SortOptions<Client>
  ): Promise<[Client[], number]> {
    this.logger.info({ msg: 'fetching clients' });
    this.logger.debug({ msg: 'search parameters', searchParams });

    const { name, branch, tags, createdAfter, createdBefore, updatedAfter, updatedBefore } = searchParams;

    const whereClause = and(
      name !== undefined ? ilike(clientTable.name, `%${name}%`) : undefined,
      branch !== undefined ? eq(clientTable.branch, branch) : undefined,
      tags !== undefined ? arrayContains(clientTable.tags, tags) : undefined,
      createDatesComparison(clientTable.createdAt, createdAfter, createdBefore),
      createDatesComparison(clientTable.updatedAt, updatedAfter, updatedBefore)
    );

    const { limit, offset } = paginationParamsToOffsetAndLimit(paginationParams);

    const clientsQuery = this.drizzle
      .select()
      .from(clientTable)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(...sortOptionsToOrderBy(clientTable, sortParams ?? {}));

    const countQuery = this.drizzle.select({ count: count() }).from(clientTable).where(whereClause);

    const [clients, countResult] = await Promise.all([clientsQuery, countQuery]);

    return [clients, countResult[0]?.count ?? 0];
  }

  public async getClient(name: string): Promise<Client> {
    this.logger.info({ msg: 'fetching client', name });

    const client = await this.drizzle.query.client.findFirst({ where: { name } });

    this.logger.debug('client result returned from db');

    if (client === undefined) {
      this.logger.debug('client result was null');
      throw new ClientNotFoundError("A client with the given name doesn't exists in the database");
    }

    return client;
  }

  public async createClient(client: NewClient): Promise<Client> {
    this.logger.info({ msg: 'creating domain', name: client.name });
    try {
      const res = await this.drizzle.insert(clientTable).values(client).returning();

      this.logger.debug('client result returned from db');

      return res[0] as Client;
    } catch (error) {
      if (isDrizzleQueryError(error) && error.cause instanceof DatabaseError && error.cause.code === pgErrorCodes.UNIQUE_VIOLATION) {
        throw new ClientAlreadyExistsError('client already exists');
      }
      this.logger.debug('create client throw an unrecognized error');
      throw error;
    }
  }

  public async updateClient(client: NewClient): Promise<Client> {
    this.logger.info({ msg: 'updating client', name: client.name });

    this.logger.debug({ msg: 'updating client with following data', name: client.name, client });

    const updatedClients = await this.drizzle.update(clientTable).set(client).where(eq(clientTable.name, client.name)).returning();

    this.logger.debug('client result returned from db');
    if (updatedClients.length === 0) {
      this.logger.debug('no rows were affected by client update command');
      throw new ClientNotFoundError('client with given name was not found');
    }

    return updatedClients[0] as Client;
  }
}
