import { RequestHandler } from 'express';
import { auth } from 'express-openid-connect';
import { DependencyContainer } from 'tsyringe';
import { SERVICES } from '@src/common/constants';
import type { ConfigType } from '@src/common/config';

export function openidAuthMiddlewareFactory(container: DependencyContainer): RequestHandler {
  const config = container.resolve<ConfigType>(SERVICES.CONFIG);

  const authConfig = config.get('auth.openid');

  return auth({
    clientID: authConfig.clientId,
    issuerBaseURL: authConfig.issuerBaseUrl,
    baseURL: authConfig.baseUrl,
    authRequired: true,
    authorizationParams: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      response_type: 'code',
      scope: authConfig.scopes,
    },
    secret: authConfig.secret,
    clientSecret: authConfig.clientSecret,
    auth0Logout: false,
  });
}
