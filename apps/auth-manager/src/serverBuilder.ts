import express, { Router } from 'express';
import bodyParser from 'body-parser';
import compression, { CompressionOptions } from 'compression';
import cors from 'cors';
import { OpenapiViewerRouter } from '@map-colonies/openapi-express-viewer';
import { getErrorHandlerMiddleware } from '@map-colonies/error-express-handler';
import { middleware as OpenApiMiddleware } from 'express-openapi-validator';
import { inject, injectable } from 'tsyringe';
import { type Logger } from '@map-colonies/js-logger';
import { httpLogger } from '@map-colonies/express-access-log-middleware';
import { getTraceContexHeaderMiddleware } from '@map-colonies/telemetry';
import { collectMetricsExpressMiddleware } from '@map-colonies/telemetry/prom-metrics';
import type { Registry } from 'prom-client';
import { SERVICES } from './common/constants';
import { DOMAIN_ROUTER_SYMBOL } from './domain/routes/domainRouter';
import { CLIENT_ROUTER_SYMBOL } from './client/routes/clientRouter';
import { KEY_ROUTER_SYMBOL } from './key/routes/keyRouter';
import { ASSET_ROUTER_SYMBOL } from './asset/routes/assetRouter';
import { CONNECTION_ROUTER_SYMBOL } from './connection/routes/connectionRouter';
import { BUNDLE_ROUTER_SYMBOL } from './bundle/routes/bundleRouter';
import type { ConfigType } from './common/config';

@injectable()
export class ServerBuilder {
  private readonly serverInstance: express.Application;

  public constructor(
    @inject(SERVICES.CONFIG) private readonly config: ConfigType,
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(DOMAIN_ROUTER_SYMBOL) private readonly domainRouter: Router,
    @inject(CLIENT_ROUTER_SYMBOL) private readonly clientRouter: Router,
    @inject(KEY_ROUTER_SYMBOL) private readonly keyRouter: Router,
    @inject(ASSET_ROUTER_SYMBOL) private readonly assetRouter: Router,
    @inject(CONNECTION_ROUTER_SYMBOL) private readonly connectionRouter: Router,
    @inject(BUNDLE_ROUTER_SYMBOL) private readonly bundleRouter: Router,
    @inject(SERVICES.METRICS) private readonly metricsRegistry: Registry
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
    this.serverInstance.use('/domain', this.domainRouter);
    this.serverInstance.use('/client', this.clientRouter);
    this.serverInstance.use('/key', this.keyRouter);
    this.serverInstance.use('/asset', this.assetRouter);
    this.serverInstance.use('/connection', this.connectionRouter);
    this.serverInstance.use('/bundle', this.bundleRouter);
    this.buildDocsRoutes();
  }

  private registerPreRoutesMiddleware(): void {
    this.serverInstance.use(
      cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-API-Key'],
        exposedHeaders: ['Content-Length', 'X-Total-Count', 'X-API-Version'],
        optionsSuccessStatus: 200,
      })
    );

    this.serverInstance.use(collectMetricsExpressMiddleware({ registry: this.metricsRegistry }));
    this.serverInstance.use(httpLogger({ logger: this.logger, ignorePaths: ['/metrics'] }));

    if (this.config.get('server.response.compression.enabled')) {
      this.serverInstance.use(compression(this.config.get('server.response.compression.options') as CompressionOptions));
    }

    this.serverInstance.use(bodyParser.json(this.config.get('server.request.payload')));
    this.serverInstance.use(getTraceContexHeaderMiddleware());

    const ignorePathRegex = new RegExp(`^${this.config.get('openapiConfig.basePath')}/.*`, 'i');
    const apiSpecPath = this.config.get('openapiConfig.filePath');
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
