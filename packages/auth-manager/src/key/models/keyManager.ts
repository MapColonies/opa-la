import { Logger } from '@map-colonies/js-logger';
import { Environment, IKey } from 'auth-core';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import { KeyRepository } from '../DAL/keyRepository';
import { KeyVersionMismatchError, KeyNotFoundError } from './errors';

@injectable()
export class KeyManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.KEY_REPOSITORY) private readonly keyRepository: KeyRepository
  ) {}

  public async getLatestKeys(): Promise<IKey[]> {
    this.logger.info({ msg: 'fetching latest keys' });

    return this.keyRepository.getLatestKeys();
  }

  public async getEnvKeys(environment: Environment): Promise<IKey[]> {
    this.logger.info({ msg: 'fetching all specific environment keys', key: { environment } });

    return this.keyRepository.find({ where: { environment } });
  }

  public async getKey(environment: Environment, version: number): Promise<IKey> {
    this.logger.info({ msg: 'fetching key', key: { environment, version } });

    const key = await this.keyRepository.findOne({ where: { environment, version } });

    if (key === null) {
      this.logger.debug('key was not found in the database');
      throw new KeyNotFoundError('key was not found in the database');
    }
    return key;
  }

  public async upsertKey(key: IKey): Promise<IKey> {
    this.logger.info({ msg: 'upserting key', key: { environment: key.environment, version: key.version } });
    return this.keyRepository.manager.transaction(async (transactionManager) => {
      const transactionRepo = transactionManager.withRepository(this.keyRepository);

      const maxVersion = await transactionRepo.getMaxVersionWithLock(key.environment);

      if (maxVersion === null) {
        if (key.version !== 1) {
          const msg = 'given key version is not 1, when no key already exists';
          this.logger.debug({ msg, clientKeyVersion: key.version });
          throw new KeyVersionMismatchError(msg);
        }

        // insert
        return transactionRepo.save(key);
      }

      if (maxVersion !== key.version) {
        const msg = 'version mismatch between database key and given key';
        this.logger.debug({ msg, clientKeyVersion: key.version, dbKeyVersion: maxVersion });

        throw new KeyVersionMismatchError(msg);
      }

      // update
      return transactionRepo.save({ ...key, version: maxVersion + 1 });
    });
  }
}
