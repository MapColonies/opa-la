import { jsLogger } from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { afterAll } from 'vitest';
import type { DependencyContainer } from 'tsyringe';
import { Pool } from 'pg';
import type { Drizzle } from '@map-colonies/auth-core';
import { createRequestSender, type RequestSender } from '@map-colonies/openapi-helpers/requestSender';
import type { operations, paths } from 'auth-openapi';
import { getApp } from '@src/app';
import { initConfig } from '@src/common/config';
import { SERVICES } from '@src/common/constants';
import { OPENAPI_PATH } from '@tests/utils/paths.mjs';

export async function initEnvironment(): Promise<{
  container: DependencyContainer;
  requestSender: RequestSender<paths, operations>;
  drizzle: Drizzle;
}> {
  await initConfig(true);
  const [app, container] = await getApp({
    override: [
      { token: SERVICES.LOGGER, provider: { useValue: await jsLogger({ enabled: false }) } },
      { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
    ],
    useChild: true,
  });
  const requestSender = await createRequestSender<paths, operations>(OPENAPI_PATH, app);
  const drizzle = container.resolve<Drizzle>(SERVICES.DRIZZLE);

  afterAll(async function () {
    await container.resolve(Pool).end();
  });

  return { container, requestSender, drizzle };
}
