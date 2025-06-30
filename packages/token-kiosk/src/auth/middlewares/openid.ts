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
    secret:
      'sdnjsndkjasndkjsnamcxz mcnskjdnjwshuinsakjdnwandwaneiuajdnsjkndkjasbfhbuir34y8932h4421yh4hyu1bdyu12b34b213b213b7214n8712n483b184b123bh8wsndjisabndyu2b7843b12y4b2yu1b4hj12b4yu13b4y812h48y73bh128y74by12bndhbsydb7823bne47812bny384b12y4byu12byudbsnbd2h3by12bh4821h4',
    clientSecret: 'Qn9KmSYd9aoU2UPRRpaltcNjsdsf9k8a',
    auth0Logout: false,
  });
}
