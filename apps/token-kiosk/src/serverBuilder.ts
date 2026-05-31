import path from 'node:path';
import express, { Router, static as expressStatic } from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import { OpenapiViewerRouter } from '@map-colonies/openapi-express-viewer';
import { getErrorHandlerMiddleware } from '@map-colonies/error-express-handler';
import { middleware as OpenApiMiddleware } from 'express-openapi-validator';
import { inject, injectable } from 'tsyringe';
import type { Logger } from '@map-colonies/js-logger';
import { httpLogger } from '@map-colonies/express-access-log-middleware';
import { collectMetricsExpressMiddleware } from '@map-colonies/prometheus';
import { Registry } from 'prom-client';
import type { ConfigType } from '@common/config';
import { SERVICES } from '@common/constants';
import { TOKEN_ROUTER_SYMBOL } from './tokens/routes/tokenRouter';
import { AUTH_ROUTER_SYMBOL } from './auth/routes/authRouter';
import { openidAuthMiddlewareFactory } from './auth/middlewares/openid';
import { GUIDES_ROUTER_SYMBOL } from './guides/routes/guidesRouter';
import { FILES_ROUTER_SYMBOL } from './files/routes/filesRouter';

const OPENAPI_PATH = path.join(path.dirname(require.resolve('token-openapi')), 'openapi3.yaml');

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
    @inject(FILES_ROUTER_SYMBOL) private readonly qlrRouter: Router,
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
      filePathOrSpec: OPENAPI_PATH,
    });
    openapiRouter.setup();
    this.serverInstance.use(this.config.get('openapiConfig.basePath'), openapiRouter.getRouter());
  }

  private buildRoutes(): void {
    this.serverInstance.use('/auth', this.authRouter);
    this.serverInstance.use('/token', this.tokenRouter);
    this.serverInstance.use('/guides', this.guidesRouter);
    this.serverInstance.use('/files', this.qlrRouter);

    this.buildDocsRoutes();
  }

  private registerPreRoutesMiddleware(): void {
    this.serverInstance.use(collectMetricsExpressMiddleware({ registry: this.metricsRegistry }));
    this.serverInstance.use(httpLogger({ logger: this.logger, ignorePaths: ['/metrics'] }));

    if (this.config.get('server.response.compression.enabled')) {
      this.serverInstance.use(compression(this.config.get('server.response.compression.options') as unknown as compression.CompressionFilter));
    }

    this.serverInstance.use(bodyParser.json(this.config.get('server.request.payload')));

    this.serverInstance.use(expressStatic('public'));

    this.serverInstance.use(this.authMiddleware);

    const ignorePathRegex = new RegExp(`^${this.config.get('openapiConfig.basePath')}/.*`, 'i');

    this.serverInstance.use(
      OpenApiMiddleware({ apiSpec: OPENAPI_PATH, validateRequests: true, ignorePaths: ignorePathRegex, validateSecurity: false })
    );
  }

  private registerPostRoutesMiddleware(): void {
    this.serverInstance.use(getErrorHandlerMiddleware());
  }
}
