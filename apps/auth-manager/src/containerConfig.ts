import { getOtelMixin } from '@map-colonies/tracing-utils';
import { trace } from '@opentelemetry/api';
import { instanceCachingFactory } from 'tsyringe';
import type { DependencyContainer } from 'tsyringe/dist/typings/types';
import { jsLogger } from '@map-colonies/js-logger';
import { Pool } from 'pg';
import { createDrizzle } from '@map-colonies/auth-core';
import { healthCheck, initConnection } from '@map-colonies/drizzle-utils';
import { Registry } from 'prom-client';
import { SERVICES, SERVICE_NAME } from './common/constants';
import { domainRouterFactory, DOMAIN_ROUTER_SYMBOL } from './domain/routes/domainRouter';
import type { InjectionObject } from './common/dependencyRegistration';
import { registerDependencies } from './common/dependencyRegistration';
import { clientRouterFactory, CLIENT_ROUTER_SYMBOL } from './client/routes/clientRouter';
import { keyRouterFactory, KEY_ROUTER_SYMBOL } from './key/routes/keyRouter';
import { assetRouterFactory, ASSET_ROUTER_SYMBOL } from './asset/routes/assetRouter';
import { connectionRouterFactory, CONNECTION_ROUTER_SYMBOL } from './connection/routes/connectionRouter';
import { bundleRouterFactory, BUNDLE_ROUTER_SYMBOL } from './bundle/routes/bundleRouter';
import { getConfig } from './common/config';
import { getTracing } from './common/tracing';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = async (options?: RegisterOptions): Promise<DependencyContainer> => {
  const configInstance = getConfig();

  const loggerConfig = configInstance.get('telemetry.logger');

  const logger = await jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, mixin: getOtelMixin() });

  const dataSourceOptions = configInstance.get('db');

  let pool: Pool;
  try {
    pool = await initConnection(dataSourceOptions);
  } catch (error) {
    throw new Error(`Failed to connect to the database`, { cause: error });
  }

  const tracer = trace.getTracer(SERVICE_NAME);
  const metricsRegistry = new Registry();
  configInstance.initializeMetrics(metricsRegistry);

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: configInstance } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: SERVICES.METRICS, provider: { useValue: metricsRegistry } },
    { token: Pool, provider: { useValue: pool } },
    {
      token: SERVICES.DRIZZLE,
      provider: {
        useFactory: instanceCachingFactory((container) => {
          const pool = container.resolve(Pool);
          return createDrizzle(pool);
        }),
      },
    },
    {
      token: SERVICES.HEALTHCHECK,
      provider: {
        useFactory: instanceCachingFactory((container) => {
          const connection = container.resolve(Pool);
          return healthCheck(connection);
        }),
      },
    },
    // {
    //   token: SERVICES.DOMAIN_REPOSITORY,
    //   provider: { useFactory: instanceCachingFactory(domainRepositoryFactory) },
    // },
    { token: DOMAIN_ROUTER_SYMBOL, provider: { useFactory: domainRouterFactory } },
    // {
    //   token: SERVICES.CLIENT_REPOSITORY,
    //   provider: { useFactory: instanceCachingFactory(clientRepositoryFactory) },
    // },
    { token: CLIENT_ROUTER_SYMBOL, provider: { useFactory: clientRouterFactory } },
    // {
    //   token: SERVICES.KEY_REPOSITORY,
    //   provider: { useFactory: instanceCachingFactory(keyRepositoryFactory) },
    // },
    { token: KEY_ROUTER_SYMBOL, provider: { useFactory: keyRouterFactory } },
    // {
    //   token: SERVICES.ASSET_REPOSITORY,
    //   provider: { useFactory: instanceCachingFactory(assetRepositoryFactory) },
    // },
    { token: ASSET_ROUTER_SYMBOL, provider: { useFactory: assetRouterFactory } },
    // {
    //   token: SERVICES.CONNECTION_REPOSITORY,
    //   provider: { useFactory: instanceCachingFactory(connectionRepositoryFactory) },
    // },
    { token: CONNECTION_ROUTER_SYMBOL, provider: { useFactory: connectionRouterFactory } },
    // {
    //   token: SERVICES.BUNDLE_REPOSITORY,
    //   provider: {
    //     useFactory: instanceCachingFactory((c) => c.resolve(DataSource).getRepository(Bundle)),
    //   },
    // },
    { token: BUNDLE_ROUTER_SYMBOL, provider: { useFactory: bundleRouterFactory } },
    {
      token: 'onSignal',
      provider: {
        useValue: async (): Promise<void> => {
          await Promise.all([getTracing().stop(), pool.end()]);
        },
      },
    },
  ];

  return registerDependencies(dependencies, options?.override, options?.useChild);
};
