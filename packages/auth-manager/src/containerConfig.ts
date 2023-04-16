import config from 'config';
import { getOtelMixin } from '@map-colonies/telemetry';
import { trace } from '@opentelemetry/api';
import { instanceCachingFactory } from 'tsyringe';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import { Metrics } from '@map-colonies/telemetry';
import { DataSource } from 'typeorm';
import { HealthCheck } from '@godaddy/terminus';
import { Bundle, DbConfig, initConnection } from '@map-colonies/auth-core';
import { DB_CONNECTION_TIMEOUT, SERVICES, SERVICE_NAME } from './common/constants';
import { tracing } from './common/tracing';
import { domainRouterFactory, DOMAIN_ROUTER_SYMBOL } from './domain/routes/domainRouter';
import { InjectionObject, registerDependencies } from './common/dependencyRegistration';
import { promiseTimeout } from './common/utils/promiseTimeout';
import { clientRouterFactory, CLIENT_ROUTER_SYMBOL } from './client/routes/clientRouter';
import { clientRepositoryFactory } from './client/DAL/clientRepository';
import { keyRepositoryFactory } from './key/DAL/keyRepository';
import { keyRouterFactory, KEY_ROUTER_SYMBOL } from './key/routes/keyRouter';
import { assetRouterFactory, ASSET_ROUTER_SYMBOL } from './asset/routes/assetRouter';
import { assetRepositoryFactory } from './asset/DAL/assetRepository';
import { connectionRepositoryFactory } from './connection/DAL/connectionRepository';
import { connectionRouterFactory, CONNECTION_ROUTER_SYMBOL } from './connection/routes/connectionRouter';
import { domainRepositoryFactory } from './domain/DAL/domainRepository';
import { bundleRouterFactory, BUNDLE_ROUTER_SYMBOL } from './bundle/routes/bundleRouter';

const healthCheck = (connection: DataSource): HealthCheck => {
  return async (): Promise<void> => {
    const check = connection.query('SELECT 1').then(() => {
      return;
    });
    return promiseTimeout<void>(DB_CONNECTION_TIMEOUT, check);
  };
};

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = async (options?: RegisterOptions): Promise<DependencyContainer> => {
  const loggerConfig = config.get<LoggerOptions>('telemetry.logger');
  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, mixin: getOtelMixin() });

  const dataSourceOptions = config.get<DbConfig>('db');
  const connection = await initConnection(dataSourceOptions);

  const metrics = new Metrics();
  metrics.start();

  tracing.start();
  const tracer = trace.getTracer(SERVICE_NAME);

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: config } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: DataSource, provider: { useValue: connection } },
    {
      token: SERVICES.HEALTHCHECK,
      provider: {
        useFactory: instanceCachingFactory((container) => {
          const connection = container.resolve(DataSource);
          return healthCheck(connection);
        }),
      },
    },
    {
      token: SERVICES.DOMAIN_REPOSITORY,
      provider: { useFactory: instanceCachingFactory(domainRepositoryFactory) },
    },
    { token: DOMAIN_ROUTER_SYMBOL, provider: { useFactory: domainRouterFactory } },
    {
      token: SERVICES.CLIENT_REPOSITORY,
      provider: { useFactory: instanceCachingFactory(clientRepositoryFactory) },
    },
    { token: CLIENT_ROUTER_SYMBOL, provider: { useFactory: clientRouterFactory } },
    {
      token: SERVICES.KEY_REPOSITORY,
      provider: { useFactory: instanceCachingFactory(keyRepositoryFactory) },
    },
    { token: KEY_ROUTER_SYMBOL, provider: { useFactory: keyRouterFactory } },
    {
      token: SERVICES.ASSET_REPOSITORY,
      provider: { useFactory: instanceCachingFactory(assetRepositoryFactory) },
    },
    { token: ASSET_ROUTER_SYMBOL, provider: { useFactory: assetRouterFactory } },
    {
      token: SERVICES.CONNECTION_REPOSITORY,
      provider: { useFactory: instanceCachingFactory(connectionRepositoryFactory) },
    },
    { token: CONNECTION_ROUTER_SYMBOL, provider: { useFactory: connectionRouterFactory } },
    {
      token: SERVICES.BUNDLE_REPOSITORY,
      provider: {
        useFactory: instanceCachingFactory((c) => c.resolve(DataSource).getRepository(Bundle)),
      },
    },
    { token: BUNDLE_ROUTER_SYMBOL, provider: { useFactory: bundleRouterFactory } },
    {
      token: 'onSignal',
      provider: {
        useValue: {
          useValue: async (): Promise<void> => {
            await Promise.all([tracing.stop(), metrics.stop(), connection.destroy()]);
          },
        },
      },
    },
  ];

  return registerDependencies(dependencies, options?.override, options?.useChild);
};
