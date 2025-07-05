import type { Logger } from '@map-colonies/js-logger';
import { addMilliseconds, formatISO, hoursToSeconds } from 'date-fns';
import parseDuration from 'parse-duration';
import { SignJWT } from 'jose';
import { inject, injectable } from 'tsyringe';
import { Cache, createCache } from 'async-cache-dedupe';
import type { components } from '@openapi';
import { SERVICES } from '@common/constants';
import type { components as authManagerComponents } from '@src/auth-manager';
import type { AuthManagerClient } from './authManagerClient';

export type TokenResponse = components['schemas']['tokenResponse'];

export type TokenCache = Cache & {
  getPrivateKey: (env: 'np' | 'prod' | 'stage') => Promise<authManagerComponents['schemas']['key']>;
};

@injectable()
export class TokenManager {
  private readonly cache: TokenCache;
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.AUTH_MANAGER_CLIENT) private readonly authManagerClient: AuthManagerClient
  ) {
    this.cache = createCache({
      ttl: hoursToSeconds(1),
      stale: 0,
      storage: { type: 'memory' },
    }).define('getPrivateKey', this.getPrivateKey.bind(this));
  }

  public async getToken(clientId: string): Promise<TokenResponse> {
    this.logger.info({ msg: 'getting token' });

    const expiration = addMilliseconds(Date.now(), parseDuration('1w') as number);

    const token = await this.generateToken(clientId);

    return {
      token,
      expiration: formatISO(expiration, { representation: 'complete' }),
      domains: ['raster'],
    };
  }

  private async generateToken(clientId: string): Promise<string> {
    const key = await this.cache.getPrivateKey('prod');

    const jwt = new SignJWT({ id: clientId }).setSubject('c2b').setIssuer('token-kiosk').setIssuedAt().setExpirationTime('1w').setProtectedHeader({
      alg: 'RS256',
    });

    const signedJwt = await jwt.sign(key.privateKey);
    return signedJwt;
  }

  private async getPrivateKey(env: 'np' | 'prod' | 'stage'): Promise<authManagerComponents['schemas']['key']> {
    this.logger.info({ msg: 'fetching private key', env });
    const privateKey = await this.authManagerClient.GET('/key/{environment}/latest', {
      params: { path: { environment: env } },
    });
    if (privateKey.error) {
      this.logger.error({ msg: 'failed to fetch private key', env, error: privateKey.error });
      throw new Error(`Failed to fetch private key for environment ${env}`, { cause: privateKey.error });
    }
    this.logger.info({ msg: 'private key fetched successfully', env });
    return privateKey.data;
  }
}
