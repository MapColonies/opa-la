import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { createCache } from 'async-cache-dedupe';
import type { components } from '@openapi';
import { SERVICES } from '@common/constants';
import type { AuthManagerClient } from './authManagerClient';

export type TokenResponse = components['schemas']['tokenResponse'];

@injectable()
export class TokenManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.AUTH_MANAGER_CLIENT) private readonly authManagerClient: AuthManagerClient
  ) {
    const cache = createCache({
      ttl: 1000 * 60 * 60, // 1 hour
      stale: 0,
      storage: { type: 'memory' },
    }).define('getPrivateKey', async (env: 'np' | 'prod' | 'stage') => {
      this.logger.info({ msg: 'fetching private key', env });
      const privateKey = await this.authManagerClient.GET('/key/{environment}/{version}', {
        params: { path: { environment: env, version: 'latest' } },
      });
      if (privateKey.error) {
        this.logger.error({ msg: 'failed to fetch private key', env, error: privateKey.error });
        throw new Error(`Failed to fetch private key for environment ${env}`, { cause: privateKey.error });
      }
      this.logger.info({ msg: 'private key fetched successfully', env });
      return privateKey.data;
    });
  }

  public getToken(): TokenResponse {
    this.logger.info({ msg: 'getting token' });

    return {
      token: 'some-token',
      expiration: new Date(Date.now() + 3600 * 1000).toISOString(),
      domains: ['example.com'],
    };
  }
}
