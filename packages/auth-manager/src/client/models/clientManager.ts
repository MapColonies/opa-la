import { type Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { ArrayContains, ILike, QueryFailedError } from 'typeorm';
import { DatabaseError } from 'pg';
import { Client, type IClient } from '@map-colonies/auth-core';
import { SERVICES } from '@common/constants';
import { PgErrorCodes } from '@common/db/constants';
import { createDatesComparison } from '@common/db/utils';
import { SortOptions } from '@src/common/db/sort';
import { PaginationParams, paginationParamsToFindOptions } from '@src/common/db/pagination';
import { type ClientRepository } from '../DAL/clientRepository';
import { ClientSearchParams } from './client';
import { ClientAlreadyExistsError, ClientNotFoundError } from './errors';

@injectable()
export class ClientManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CLIENT_REPOSITORY) private readonly clientRepository: ClientRepository
  ) {}

  public async getClients(
    searchParams?: ClientSearchParams,
    paginationParams?: PaginationParams,
    sortParams?: SortOptions<Client>
  ): Promise<[IClient[], number]> {
    this.logger.info({ msg: 'fetching clients' });
    this.logger.debug({ msg: 'search parameters', searchParams });

    // eslint doesn't recognize this as valid because its in the type definition
    let findOptions: Parameters<typeof this.clientRepository.find>[0] = {};
    if (searchParams !== undefined) {
      const { search, branch, tags, createdAfter, createdBefore, updatedAfter, updatedBefore } = searchParams;
      findOptions = {
        where: {
          name: search !== undefined && search !== '' ? ILike(`%${search}%`) : undefined,
          tags: tags ? ArrayContains(tags) : undefined,
          branch,
          createdAt: createDatesComparison(createdAfter, createdBefore),
          updatedAt: createDatesComparison(updatedAfter, updatedBefore),
        },
      };
    }

    if (paginationParams !== undefined) {
      findOptions = {
        ...findOptions,
        ...paginationParamsToFindOptions(paginationParams),
      };
    }

    if (sortParams !== undefined) {
      findOptions.order = sortParams;
    }

    return this.clientRepository.findAndCount({ ...findOptions });
  }

  public async getClient(name: string): Promise<IClient> {
    this.logger.info({ msg: 'fetching client', name });

    const client = await this.clientRepository.findOne({ where: { name } });

    this.logger.debug('client result returned from db');

    if (client === null) {
      this.logger.debug('client result was null');
      throw new ClientNotFoundError("A client with the given name doesn't exists in the database");
    }

    return client;
  }

  public async createClient(client: IClient): Promise<IClient> {
    this.logger.info({ msg: 'creating domain', name: client.name });
    try {
      await this.clientRepository.insert(client);

      this.logger.debug('client result returned from db');

      return client;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError instanceof DatabaseError &&
        error.driverError.code === PgErrorCodes.UNIQUE_VIOLATION
      ) {
        throw new ClientAlreadyExistsError('client already exists');
      }
      this.logger.debug('create client throw an unrecognized error');
      throw error;
    }
  }

  public async updateClient(name: string, client: Omit<IClient, 'name' | 'createdAt' | 'updatedAt'>): Promise<IClient> {
    this.logger.info({ msg: 'updating client', name });

    this.logger.debug({ msg: 'updating client with following data', name, client });

    const updatedClient = await this.clientRepository.updateAndReturn({ name, ...client });

    this.logger.debug('client result returned from db');
    if (updatedClient === null) {
      this.logger.debug('no rows were affected by client update command');
      throw new ClientNotFoundError('client with given name was not found');
    }

    return updatedClient;
  }
}
