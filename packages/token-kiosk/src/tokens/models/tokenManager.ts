import type { Logger } from '@map-colonies/js-logger';
import { addMilliseconds, formatISO, hoursToSeconds, isAfter } from 'date-fns';
import parseDuration from 'parse-duration';
import { SignJWT } from 'jose';
import { inject, injectable } from 'tsyringe';
import { Cache, createCache } from 'async-cache-dedupe';
import type { components } from '@openapi';
import type { ConfigType } from '@src/common/config';
import { AuthManager } from '@src/auth/model/authManager';
import { UserManager } from '@src/users/userManager';
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
    @inject(SERVICES.CONFIG) private readonly config: ConfigType,
    @inject(SERVICES.AUTH_MANAGER_CLIENT) private readonly authManagerClient: AuthManagerClient,
    @inject(AuthManager) private readonly authManager: AuthManager,
    @inject(UserManager) private readonly userManager: UserManager
  ) {
    this.cache = createCache({
      ttl: hoursToSeconds(this.config.get('token.authManager.cacheTtlHours')),
      stale: 0,
      storage: { type: 'memory' },
    }).define('getPrivateKey', this.getPrivateKey.bind(this));
  }

  public async getToken(clientId: string, userDetails: Record<string, unknown>): Promise<TokenResponse> {
    const user = await this.userManager.getUserById(clientId);

    if (user?.isBanned === true) {
      this.logger.warn({ msg: 'user is banned', userId: clientId });
      throw new Error('User is banned');
    }

    const isUserTokenStillValid = user !== undefined && isAfter(user.tokenExpirationDate, new Date());

    if (isUserTokenStillValid) {
      this.logger.info({ msg: 'token is still valid', userId: clientId });

      await this.userManager.updateUser(user.id, {
        lastRequestedAt: new Date(),
      });

      return {
        token: user.token,
        expiration: formatISO(user.tokenExpirationDate, { representation: 'complete' }),
      };
    }

    this.logger.info({ msg: 'generating a new token' });

    const expiration = addMilliseconds(Date.now(), parseDuration(this.config.get('token.expirationDuration')) as number);

    const token = await this.generateToken(clientId);

    if (!user) {
      await this.userManager.createUser({
        id: clientId,
        metadata: this.authManager.metadataFieldsPicker(userDetails),
        lastRequestedAt: new Date(),
        token,
        tokenExpirationDate: expiration,
      });
    } else {
      await this.userManager.updateUser(user.id, {
        lastRequestedAt: new Date(),
        metadata: this.authManager.metadataFieldsPicker(userDetails),
        token,
        tokenExpirationDate: expiration,
        tokenCreationCount: user.tokenCreationCount + 1,
        tokenCreationDate: new Date(),
      });
    }

    return {
      token,
      expiration: formatISO(expiration, { representation: 'complete' }),
    };
  }

  private async generateToken(clientId: string): Promise<string> {
    const tokenConfig = this.config.get('token');
    const key = await this.cache.getPrivateKey(tokenConfig.environment);

    const jwt = new SignJWT({ id: clientId })
      .setSubject(tokenConfig.jwt.subject)
      .setIssuer(tokenConfig.jwt.issuer)
      .setIssuedAt()
      .setExpirationTime(tokenConfig.expirationDuration)
      .setProtectedHeader({
        alg: key.privateKey.alg,
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
