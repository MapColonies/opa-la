import { RequestHandler } from 'express';
import { auth } from 'express-openid-connect';

export function openidAuthMiddlewareFactory(): RequestHandler {
  return auth({
    clientID: 'my-local-app',
    issuerBaseURL: 'http://localhost:8080/realms/my-local-realm',
    baseURL: 'http://localhost:5173',
    authRequired: true,
    authorizationParams: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      response_type: 'code',
      scope: 'openid profile email',
    },
    secret: 'sdfsdasdsadsadsadsadsadas',
    clientSecret: '78vaqxyFyyf1xeTHXzgzNlhCVtW83Zi7',
    auth0Logout: false,
  });
}
