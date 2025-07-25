import { getOtelMixin } from '@map-colonies/telemetry';
import { trace } from '@opentelemetry/api';
import { Registry } from 'prom-client';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import jsLogger from '@map-colonies/js-logger';
import { Pool } from 'pg';
import { instanceCachingFactory, instancePerContainerCachingFactory } from 'tsyringe';
import { InjectionObject, registerDependencies } from '@common/dependencyRegistration';
import { SERVICES, SERVICE_NAME } from '@common/constants';
import { getTracing } from '@common/tracing';
import { tokenRouterFactory, TOKEN_ROUTER_SYMBOL } from './tokens/routes/tokenRouter';
import { getConfig } from './common/config';
import { AUTH_ROUTER_SYMBOL, authRouterFactory } from './auth/routes/authRouter';
import { authManagerClientFactory } from './tokens/models/authManagerClient';
import { createConnectionOptions, createDrizzle, healthCheck, initConnection } from './db/createConnection';
import { openidAuthMiddlewareFactory } from './auth/middlewares/openid';
import { GUIDES_ROUTER_SYMBOL, guidesRouterFactory } from './guides/routes/guidesRouter';
import { FILES_ROUTER_SYMBOL, filesRouterFactory } from './files/routes/filesRouter';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = async (options?: RegisterOptions): Promise<DependencyContainer> => {
  const configInstance = getConfig();

  const loggerConfig = configInstance.get('telemetry.logger');

  const logger = jsLogger({
    ...loggerConfig,
    prettyPrint: loggerConfig.prettyPrint,
    mixin: getOtelMixin(),
    redact: ['res.headers["set-cookie"]', 'req.headers.cookie'],
  });

  const tracer = trace.getTracer(SERVICE_NAME);
  const metricsRegistry = new Registry();
  configInstance.initializeMetrics(metricsRegistry);

  let pool: Pool;
  try {
    pool = await initConnection(createConnectionOptions(configInstance.get('db')));
  } catch (error) {
    throw new Error(`Failed to connect to the database`, { cause: error });
  }

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: configInstance } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: SERVICES.METRICS, provider: { useValue: metricsRegistry } },
    { token: TOKEN_ROUTER_SYMBOL, provider: { useFactory: tokenRouterFactory } },
    { token: AUTH_ROUTER_SYMBOL, provider: { useFactory: authRouterFactory } },
    { token: GUIDES_ROUTER_SYMBOL, provider: { useFactory: guidesRouterFactory } },
    { token: FILES_ROUTER_SYMBOL, provider: { useFactory: filesRouterFactory } },
    { token: SERVICES.AUTH_MANAGER_CLIENT, provider: { useFactory: authManagerClientFactory } },
    { token: SERVICES.AUTH_MIDDLEWARE, provider: { useFactory: openidAuthMiddlewareFactory } },
    { token: SERVICES.PG_POOL, provider: { useValue: pool } },
    {
      token: SERVICES.HEALTHCHECK,
      provider: {
        useFactory: instanceCachingFactory((container) => {
          const connection = container.resolve<Pool>(SERVICES.PG_POOL);
          return healthCheck(connection);
        }),
      },
    },
    {
      token: SERVICES.DRIZZLE,
      provider: {
        useFactory: instancePerContainerCachingFactory((container) => {
          return createDrizzle(container.resolve(SERVICES.PG_POOL));
        }),
      },
    },
    {
      token: 'onSignal',
      provider: {
        useValue: {
          useValue: async (): Promise<void> => {
            await Promise.all([getTracing().stop()]);
          },
        },
      },
    },
  ];

  return Promise.resolve(registerDependencies(dependencies, options?.override, options?.useChild));
};
