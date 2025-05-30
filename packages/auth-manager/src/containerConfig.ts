import { getOtelMixin } from '@map-colonies/telemetry';
import { trace } from '@opentelemetry/api';
import { instanceCachingFactory } from 'tsyringe';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import jsLogger from '@map-colonies/js-logger';
import { DataSource } from 'typeorm';
import { HealthCheck } from '@godaddy/terminus';
import { Bundle, initConnection } from '@map-colonies/auth-core';
import { Registry } from 'prom-client';
import { DB_CONNECTION_TIMEOUT, SERVICES, SERVICE_NAME } from './common/constants';
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
import { getConfig } from './common/config';
import { getTracing } from './common/tracing';

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
  const configInstance = getConfig();

  const loggerConfig = configInstance.get('telemetry.logger');

  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, mixin: getOtelMixin() });

  const dataSourceOptions = configInstance.get('db');
  const connection = await initConnection(dataSourceOptions);

  const tracer = trace.getTracer(SERVICE_NAME);
  const metricsRegistry = new Registry();
  configInstance.initializeMetrics(metricsRegistry);

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: configInstance } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: SERVICES.METRICS, provider: { useValue: metricsRegistry } },
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
            await Promise.all([getTracing().stop(), connection.destroy()]);
          },
        },
      },
    },
  ];

  return registerDependencies(dependencies, options?.override, options?.useChild);
};
