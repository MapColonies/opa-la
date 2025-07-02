import { RequestHandler } from 'express';
import { auth } from 'express-openid-connect';

export function openidAuthMiddlewareFactory(): RequestHandler {
  return auth({
    clientID: 'my-local-app',
    issuerBaseURL: 'http://localhost:8080/realms/my-local-app',
    baseURL: 'http://localhost:5173',
    authRequired: true,
    authorizationParams: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      response_type: 'code',
      scope: 'openid profile email',
    },
    secret: '<A BIG SECRET STRING HERE, e.g., a UUID or a long random string>',
    clientSecret: '<A BIG SECRET STRING HERE, e.g., a UUID or a long random string>',
    auth0Logout: false,
  });
}
