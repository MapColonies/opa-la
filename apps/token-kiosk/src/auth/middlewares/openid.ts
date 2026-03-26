import { RequestHandler } from 'express';
import { auth, type SessionStore } from 'express-openid-connect';
import { DependencyContainer } from 'tsyringe';
import session from 'express-session';
import createMemoryStore from 'memorystore';
import { SERVICES } from '@src/common/constants';
import type { ConfigType } from '@src/common/config';

const memoryStore = createMemoryStore(session);

export function openidAuthMiddlewareFactory(container: DependencyContainer): RequestHandler {
  const config = container.resolve<ConfigType>(SERVICES.CONFIG);

  const authConfig = config.get('auth.openid');

  return auth({
    clientID: authConfig.clientId,
    issuerBaseURL: authConfig.issuerBaseUrl,
    baseURL: authConfig.baseUrl,
    authRequired: true,
    session: {
      store: new memoryStore({
        checkPeriod: 3600000,
      }) as unknown as SessionStore,
    },
    authorizationParams: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      response_type: 'code',
      scope: authConfig.scopes,
      resource: authConfig.resource,
    },
    secret: authConfig.secret,
    clientSecret: authConfig.clientSecret,
    auth0Logout: false,
  });
}
