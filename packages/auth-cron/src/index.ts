import path from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { env } from 'node:process';
import { createServer } from 'node:http';
import express from 'express';
import { createTerminus } from '@godaddy/terminus';
import { CatchCallbackFn, Cron } from 'croner';
import { DataSource, Repository } from 'typeorm';
import { Bundle, Environments, initConnection } from '@map-colonies/auth-core';
import type { commonDbFullV1Type } from '@map-colonies/schemas';
import { BundleDatabase } from '@map-colonies/auth-bundler';
import { collectMetricsExpressMiddleware } from '@map-colonies/telemetry/prom-metrics';
import { getJob } from './job';
import { getConfig } from './config';
import { emptyDir } from './util';
import { logger } from './telemetry/logger';
import { metricsRegistry } from './telemetry/metrics';

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const SERVER_PORT = env['SERVER_PORT'] ?? 8080;

async function initDb(dbConfig: commonDbFullV1Type): Promise<[DataSource, BundleDatabase, Repository<Bundle>]> {
  logger?.debug('initializing database connection');
  const dataSource = await initConnection(dbConfig);
  return [dataSource, new BundleDatabase(dataSource), dataSource.getRepository(Bundle)];
}

const errorHandler: CatchCallbackFn = (err, job) => {
  logger?.error({ msg: 'failed running job', err, bundleEnv: job.name });
};

const main = async (): Promise<void> => {
  const config = getConfig();
  const cronConfig = config.get('cron');
  const dbConfig = config.get('db');
  const [dataSource, bundleDatabase, bundleRepository] = await initDb(dbConfig);

  Object.entries(cronConfig).map(([env, value]) => {
    logger?.info({ msg: 'initializing new update bundle job', bundleEnv: env });

    const workdir = mkdtempSync(path.join(tmpdir(), `authbundler-${env}-`));
    const job = getJob(bundleRepository, bundleDatabase, env as Environments, workdir);

    return Cron(value.pattern, { unref: false, protect: true, catch: errorHandler, name: env }, async () => {
      logger?.info({ msg: 'running new update job', bundleEnv: env });

      await job();
      await emptyDir(workdir);
    });
  });

  const app = express();
  app.use(collectMetricsExpressMiddleware({ registry: metricsRegistry }));

  const server = createTerminus(createServer(app), {
    healthChecks: {
      '/liveness': async () => {
        await dataSource.query('SELECT 1');
      },
    },
  });

  server.listen(SERVER_PORT, () => {
    logger?.info(`liveness and metrics are up at port ${SERVER_PORT}`);
  });
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
main().catch((err) => logger?.error({ msg: 'program terminated with an error', err }));
