import { type Logger } from '@map-colonies/js-logger';
import { type Drizzle, Environments, Key, keyTable, NewKey } from '@map-colonies/auth-core';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '@common/constants';
import { KeyRepository } from '../DAL/keyRepository';
import { KeyVersionMismatchError, KeyNotFoundError } from './errors';

@injectable()
export class KeyManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(KeyRepository) private readonly keyRepository: KeyRepository,
    @inject(SERVICES.DRIZZLE) private readonly drizzle: Drizzle
  ) {}

  public async getLatestKeys(): Promise<Key[]> {
    this.logger.info({ msg: 'fetching latest keys' });

    return this.keyRepository.getLatestKeys();
  }

  public async getEnvKeys(environment: Environments): Promise<Key[]> {
    this.logger.info({ msg: 'fetching all specific environment keys', key: { environment } });

    // return this.keyRepository.find({ where: { environment } });
    return this.drizzle.query.key.findMany({ where: { environment } });
  }

  public async getKey(environment: Environments, version: number): Promise<Key> {
    this.logger.info({ msg: 'fetching key', key: { environment, version } });

    // const key = await this.keyRepository.findOne({ where: { environment, version } });
    const key = await this.drizzle.query.key.findFirst({ where: { environment, version } });

    if (key === undefined) {
      this.logger.debug('key was not found in the database');
      throw new KeyNotFoundError('key was not found in the database');
    }
    return key;
  }

  public async getLatestKey(environment: Environments): Promise<Key> {
    this.logger.info({ msg: 'fetching latest key', key: { environment } });
    const version = await this.keyRepository.getMaxVersion(environment);
    if (version === null) {
      this.logger.debug('latest key was not found in the database');
      throw new KeyNotFoundError('latest key was not found in the database');
    }
    return this.getKey(environment, version);
  }

  public async upsertKey(key: NewKey): Promise<Key> {
    this.logger.info({ msg: 'upserting key', key: { environment: key.environment, version: key.version } });
    // return this.keyRepository.manager.transaction(async (transactionManager) => {
    //   const transactionRepo = transactionManager.withRepository(this.keyRepository);

    //   const maxVersion = await transactionRepo.getMaxVersionWithLock(key.environment);

    //   if (maxVersion === null) {
    //     if (key.version !== 1) {
    //       const msg = 'given key version is not 1, when no key already exists';
    //       this.logger.debug({ msg, clientKeyVersion: key.version });
    //       throw new KeyVersionMismatchError(msg);
    //     }

    //     // insert
    //     return transactionRepo.save(key);
    //   }

    //   if (maxVersion !== key.version) {
    //     const msg = 'version mismatch between database key and given key';
    //     this.logger.debug({ msg, clientKeyVersion: key.version, dbKeyVersion: maxVersion });

    //     throw new KeyVersionMismatchError(msg);
    //   }

    //   // update
    //   return transactionRepo.save({ ...key, version: maxVersion + 1 });
    // });
    return this.drizzle.transaction(async (tx) => {
      const maxVersion = await this.keyRepository.getMaxVersionWithLock(key.environment, tx);

      if (maxVersion === null) {
        if (key.version !== 1) {
          const msg = 'given key version is not 1, when no key already exists';
          this.logger.debug({ msg, clientKeyVersion: key.version });
          throw new KeyVersionMismatchError(msg);
        }

        // insert
        const res = await tx.insert(keyTable).values(key).returning();
        return res[0] as Key;
      }

      if (maxVersion !== key.version) {
        const msg = 'version mismatch between database key and given key';
        this.logger.debug({ msg, clientKeyVersion: key.version, dbKeyVersion: maxVersion });

        throw new KeyVersionMismatchError(msg);
      }

      // update
      const res = await tx
        .insert(keyTable)
        .values({ ...key, version: maxVersion + 1 })
        .returning();
      return res[0] as Key;
    });
  }
}
