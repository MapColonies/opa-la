import path from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { DbConfig, Bundle, Environment, initConnection } from '@map-colonies/auth-core';
import { BundleDatabase } from '@map-colonies/auth-bundler';
import config from 'config';
import { CatchCallbackFn, Cron } from 'croner';
import { Repository } from 'typeorm';
import { getJob } from './job';
import { AppConfig, CronConfig } from './config';
import { emptyDir } from './util';
import { validateConfigSchema } from './validators';
import { validateS3 } from './validators';
import { logger } from './logger';

const cronConfig = config.get<AppConfig['cron']>('cron') as Record<Environment, CronConfig>;

async function initDb(): Promise<[BundleDatabase, Repository<Bundle>]> {
  logger.debug('initializing database connection');
  const dataSource = await initConnection(config.get<DbConfig>('db'));
  await dataSource.initialize();
  return [new BundleDatabase(dataSource), dataSource.getRepository(Bundle)];
}

async function runStartupValidators(): Promise<void> {
  logger.debug('running startup validations');
  validateConfigSchema(config.util.toObject(undefined) as AppConfig);

  await validateS3(Object.keys(cronConfig) as Environment[]);
}

const errorHandler: CatchCallbackFn = (err, job) => {
  logger.error({ msg: 'failed running job', err, bundleEnv: job.name });
};

const main = async (): Promise<void> => {
  await runStartupValidators();
  const [bundleDatabase, bundleRepository] = await initDb();

  Object.entries(cronConfig).map(([env, value]) => {
    logger.info({ msg: 'initializing new update bundle job', bundleEnv: env });

    const workdir = mkdtempSync(path.join(tmpdir(), `authbundler-${env}-`));
    const job = getJob(bundleRepository, bundleDatabase, env as Environment, workdir);

    return Cron(value.pattern, { unref: false, protect: true, catch: errorHandler, name: env }, async () => {
      logger.info({ msg: 'running new update job', bundleEnv: env });

      await job();
      await emptyDir(workdir);
    });
  });
};

main().catch(logger.error);

// ADD LIVENESS
