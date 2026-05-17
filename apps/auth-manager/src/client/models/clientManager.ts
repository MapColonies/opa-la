import { type Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
// import { ArrayContains, ILike, QueryFailedError } from 'typeorm';
import { DatabaseError } from 'pg';
import { count, DrizzleQueryError, eq, and, arrayContains, between } from 'drizzle-orm';
import { clientTable, type Client, type Drizzle, type NewClient } from '@map-colonies/auth-core';
import { SERVICES } from '@common/constants';
import { pgErrorCodes } from '@common/db/constants';
import { createDatesComparison } from '@common/db/utils';
import { SortOptions } from '@src/common/db/sort';
import { PaginationParams, paginationParamsToFindOptions, paginationParamsToOffsetAndLimit } from '@src/common/db/pagination';
import { ClientAlreadyExistsError, ClientNotFoundError } from './errors';
import { ClientSearchParams } from './client';

function isQueryFailedError(err: unknown): err is DrizzleQueryError {
  return typeof err === 'object' && err !== null && 'name' in err && (err as Error).name === 'QueryFailedError';
}

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

    // eslint doesn't recognize this as valid because its in the type definition
    // let findOptions: Parameters<typeof this.clientRepository.find>[0] = {};
    const { name, branch, tags, createdAfter, createdBefore, updatedAfter, updatedBefore } = searchParams;
    // findOptions = {
    //   where: {
    //     name: name !== undefined ? ILike(`%${name}%`) : undefined,
    //     tags: tags ? ArrayContains(tags) : undefined,
    //     branch,
    //     createdAt: createDatesComparison(createdAfter, createdBefore),
    //     updatedAt: createDatesComparison(updatedAfter, updatedBefore),
    //   },
    // };

    // if (paginationParams !== undefined) {
    //   findOptions = {
    //     ...findOptions,
    //     ...paginationParamsToFindOptions(paginationParams),
    //   };
    // }

    // if (sortParams !== undefined) {
    //   findOptions.order = sortParams;
    // }

    // return this.clientRepository.findAndCount({ ...findOptions });

    // let findOptions: Parameters<typeof this.drizzle.select()>[0] = {
    //   where: {
    //   },
    // };

    const whereClause = and(
      name !== undefined ? eq(clientTable.name, name) : undefined,
      branch !== undefined ? eq(clientTable.branch, branch) : undefined,
      tags !== undefined ? arrayContains(clientTable.tags, tags) : undefined,
      createDatesComparison(clientTable.createdAt, createdAfter, createdBefore),
      createDatesComparison(clientTable.updatedAt, updatedAfter, updatedBefore)
    );

    const { limit, offset } = paginationParamsToOffsetAndLimit(paginationParams);

    const clients = await this.drizzle.select().from(clientTable).where(whereClause).limit(limit).offset(offset).orderBy(sortParams);

    const countResult = await this.drizzle.select({ count: count() }).from(clientTable).where(whereClause);
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
      if (isQueryFailedError(error) && error.cause instanceof DatabaseError && error.cause.code === pgErrorCodes.UNIQUE_VIOLATION) {
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
