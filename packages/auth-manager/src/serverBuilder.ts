import express, { Router } from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import { OpenapiViewerRouter, OpenapiRouterConfig } from '@map-colonies/openapi-express-viewer';
import { getErrorHandlerMiddleware } from '@map-colonies/error-express-handler';
import { middleware as OpenApiMiddleware } from 'express-openapi-validator';
import { inject, injectable } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import httpLogger from '@map-colonies/express-access-log-middleware';
import { defaultMetricsMiddleware, getTraceContexHeaderMiddleware } from '@map-colonies/telemetry';
import { SERVICES } from './common/constants';
import { IConfig } from './common/interfaces';
import { DOMAIN_ROUTER_SYMBOL } from './domain/routes/domainRouter';
import { CLIENT_ROUTER_SYMBOL } from './client/routes/clientRouter';
import { KEY_ROUTER_SYMBOL } from './key/routes/keyRouter';
import { ASSET_ROUTER_SYMBOL } from './asset/routes/assetRouter';
import { CONNECTION_ROUTER_SYMBOL } from './connection/routes/connectionRouter';

@injectable()
export class ServerBuilder {
  private readonly serverInstance: express.Application;

  public constructor(
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(DOMAIN_ROUTER_SYMBOL) private readonly domainRouter: Router,
    @inject(CLIENT_ROUTER_SYMBOL) private readonly clientRouter: Router,
    @inject(KEY_ROUTER_SYMBOL) private readonly keyRouter: Router,
    @inject(ASSET_ROUTER_SYMBOL) private readonly assetRouter: Router,
    @inject(CONNECTION_ROUTER_SYMBOL) private readonly connectionRouter: Router
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
      ...this.config.get<OpenapiRouterConfig>('openapiConfig'),
      filePathOrSpec: this.config.get<string>('openapiConfig.filePath'),
    });
    openapiRouter.setup();
    this.serverInstance.use(this.config.get<string>('openapiConfig.basePath'), openapiRouter.getRouter());
  }

  private buildRoutes(): void {
    this.serverInstance.use('/domain', this.domainRouter);
    this.serverInstance.use('/client', this.clientRouter);
    this.serverInstance.use('/key', this.keyRouter);
    this.serverInstance.use('/asset', this.assetRouter);
    this.serverInstance.use('/connection', this.connectionRouter);
    this.buildDocsRoutes();
  }

  private registerPreRoutesMiddleware(): void {
    this.serverInstance.use('/metrics', defaultMetricsMiddleware());
    this.serverInstance.use(httpLogger({ logger: this.logger, ignorePaths: ['/metrics'] }));

    if (this.config.get<boolean>('server.response.compression.enabled')) {
      this.serverInstance.use(compression(this.config.get<compression.CompressionFilter>('server.response.compression.options')));
    }

    this.serverInstance.use(bodyParser.json(this.config.get<bodyParser.Options>('server.request.payload')));
    this.serverInstance.use(getTraceContexHeaderMiddleware());

    const ignorePathRegex = new RegExp(`^${this.config.get<string>('openapiConfig.basePath')}/.*`, 'i');
    const apiSpecPath = this.config.get<string>('openapiConfig.filePath');
    this.serverInstance.use(
      OpenApiMiddleware({
        apiSpec: apiSpecPath,
        validateRequests: true,
        ignorePaths: ignorePathRegex,
        formats: { phone: true },
        ajvFormats: { mode: 'full' },
      })
    );
  }

  private registerPostRoutesMiddleware(): void {
    this.serverInstance.use(getErrorHandlerMiddleware());
  }
}
