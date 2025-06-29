import express, { Router } from 'express';
import { auth } from 'express-openid-connect';
import bodyParser from 'body-parser';
import compression from 'compression';
import { OpenapiViewerRouter } from '@map-colonies/openapi-express-viewer';
import { getErrorHandlerMiddleware } from '@map-colonies/error-express-handler';
import { middleware as OpenApiMiddleware } from 'express-openapi-validator';
import { inject, injectable } from 'tsyringe';
import type { Logger } from '@map-colonies/js-logger';
import httpLogger from '@map-colonies/express-access-log-middleware';
import { collectMetricsExpressMiddleware } from '@map-colonies/telemetry/prom-metrics';
import { Registry } from 'prom-client';
import type { ConfigType } from '@common/config';
import { SERVICES } from '@common/constants';
import { RESOURCE_NAME_ROUTER_SYMBOL as TOKEN_ROUTER_SYMBOL } from './token/routes/resourceNameRouter';
import { AUTH_ROUTER_SYMBOL } from './auth/routes/authRouter';

@injectable()
export class ServerBuilder {
  private readonly serverInstance: express.Application;

  public constructor(
    @inject(SERVICES.CONFIG) private readonly config: ConfigType,
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.METRICS) private readonly metricsRegistry: Registry,
    @inject(TOKEN_ROUTER_SYMBOL) private readonly tokenRouter: Router,
    @inject(AUTH_ROUTER_SYMBOL) private readonly authRouter: Router
  ) {
    this.serverInstance = express();
  }

  public build(): express.Application {
    this.registerPreRoutesMiddleware();
    this.buildRoutes();
    this.registerPostRoutesMiddleware();

    return this.serverInstance;
  }

  private buildDocsRoutes(): void {
    const openapiRouter = new OpenapiViewerRouter({
      ...this.config.get('openapiConfig'),
      filePathOrSpec: this.config.get('openapiConfig.filePath'),
    });
    openapiRouter.setup();
    this.serverInstance.use(this.config.get('openapiConfig.basePath'), openapiRouter.getRouter());
  }

  private buildRoutes(): void {
    const router = Router();
    router.use('/auth', this.authRouter);
    router.use('/token', this.tokenRouter);

    this.serverInstance.use('/api', router);

    this.buildDocsRoutes();
  }

  private registerPreRoutesMiddleware(): void {
    this.serverInstance.use(collectMetricsExpressMiddleware({ registry: this.metricsRegistry }));
    this.serverInstance.use(httpLogger({ logger: this.logger, ignorePaths: ['/metrics'] }));

    if (this.config.get('server.response.compression.enabled')) {
      this.serverInstance.use(compression(this.config.get('server.response.compression.options') as unknown as compression.CompressionFilter));
    }

    this.serverInstance.use(bodyParser.json(this.config.get('server.request.payload')));

    this.serverInstance.use(
      auth({
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
      })
    );

    const ignorePathRegex = new RegExp(`^${this.config.get('openapiConfig.basePath')}/.*`, 'i');
    const apiSpecPath = this.config.get('openapiConfig.filePath');

    this.serverInstance.use(
      OpenApiMiddleware({ apiSpec: apiSpecPath, validateRequests: true, ignorePaths: ignorePathRegex, validateSecurity: false })
    );
  }

  private registerPostRoutesMiddleware(): void {
    this.serverInstance.use(getErrorHandlerMiddleware());
  }
}
