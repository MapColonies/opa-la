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
import { TOKEN_ROUTER_SYMBOL } from './tokens/routes/tokenRouter';
import { AUTH_ROUTER_SYMBOL } from './auth/routes/authRouter';
import { openidAuthMiddlewareFactory } from './auth/middlewares/openid';
import { GUIDES_ROUTER_SYMBOL } from './guides/routes/guidesRouter';
import { QLR_ROUTER_SYMBOL } from './qlr/routes/qlrRouter';

@injectable()
export class ServerBuilder {
  private readonly serverInstance: express.Application;

  public constructor(
    @inject(SERVICES.CONFIG) private readonly config: ConfigType,
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.METRICS) private readonly metricsRegistry: Registry,
    @inject(TOKEN_ROUTER_SYMBOL) private readonly tokenRouter: Router,
    @inject(AUTH_ROUTER_SYMBOL) private readonly authRouter: Router,
    @inject(GUIDES_ROUTER_SYMBOL) private readonly guidesRouter: Router,
    @inject(QLR_ROUTER_SYMBOL) private readonly qlrRouter: Router,
    @inject(SERVICES.AUTH_MIDDLEWARE) private readonly authMiddleware: ReturnType<typeof openidAuthMiddlewareFactory>
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
    router.use('/guides', this.guidesRouter);
    router.use('/qlr', this.qlrRouter);

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

    this.serverInstance.use(this.authMiddleware);

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
