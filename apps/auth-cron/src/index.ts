import path from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { env } from 'node:process';
import { createServer } from 'node:http';
import type { Pool } from 'pg';
import express from 'express';
import { createTerminus } from '@godaddy/terminus';
import type { CatchCallbackFn } from 'croner';
import { Cron } from 'croner';
import type { Environments } from '@map-colonies/auth-core';
import { healthCheck, initConnection } from '@map-colonies/drizzle-utils';
import type { commonDbFullV1Type } from '@map-colonies/schemas';
import { BundleDatabase } from '@map-colonies/auth-bundler';
import { collectMetricsExpressMiddleware } from '@map-colonies/prometheus';
import { getJob } from './job';
import { getConfig } from './config';
import { emptyDir } from './util';
import { logger } from './telemetry/logger';
import { metricsRegistry } from './telemetry/metrics';

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const SERVER_PORT = env['SERVER_PORT'] ?? 8080;

async function initDb(dbConfig: commonDbFullV1Type): Promise<[Pool, BundleDatabase]> {
  logger.debug('initializing database connection');
  const pool = await initConnection(dbConfig, { onError: (err) => logger.warn({ msg: 'database connection error', err }) });
  return [pool, new BundleDatabase(pool)];
}

const errorHandler: CatchCallbackFn = (err, job) => {
  logger.error({ msg: 'failed running job', err, bundleEnv: job.name });
};

const main = async (): Promise<void> => {
  const config = getConfig();
  const cronConfig = config.get('cron');
  const dbConfig = config.get('db');
  const [pool, bundleDatabase] = await initDb(dbConfig);

  Object.entries(cronConfig).map(([env, value]) => {
    logger.info({ msg: 'initializing new update bundle job', bundleEnv: env });

    const workdir = mkdtempSync(path.join(tmpdir(), `authbundler-${env}-`));
    const job = getJob(bundleDatabase, env as Environments, workdir);

    return Cron(value.pattern, { unref: false, protect: true, catch: errorHandler, name: env }, async () => {
      logger.info({ msg: 'running new update job', bundleEnv: env });

      // the workdir is reused between runs, so it must be emptied even when the job fails,
      // otherwise leftover files end up in the next bundle
      try {
        await job();
      } finally {
        // a cleanup failure is only logged, so it doesn't mask the job's own error
        try {
          await emptyDir(workdir);
        } catch (err) {
          logger.error({ msg: 'failed emptying the workdir', err, bundleEnv: env });
        }
      }
    });
  });

  const app = express();
  app.use(collectMetricsExpressMiddleware({ registry: metricsRegistry }));

  const server = createTerminus(createServer(app), {
    onSignal: async () => {
      logger.info('server is starting cleanup');
      await pool.end();
      logger.info('database connection closed');
    },
    healthChecks: {
      '/liveness': healthCheck(pool),
    },
  });

  server.listen(SERVER_PORT, () => {
    logger.info(`liveness and metrics are up at port ${SERVER_PORT}`);
  });
};

main().catch((err) => logger.error({ msg: 'program terminated with an error', err }));
