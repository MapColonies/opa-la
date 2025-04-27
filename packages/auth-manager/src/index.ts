/* eslint-disable import/first */
// this import must be called before the first import of tsyringe
import 'reflect-metadata';
import { createServer } from 'http';
import { createTerminus, HealthCheck } from '@godaddy/terminus';
import { Logger } from '@map-colonies/js-logger';
import { SERVICES } from './common/constants';
import { getApp } from './app';
import { ConfigType } from './common/config';

const SHUTDOWN_TIMEOUT_MS = 10000;
const HEALTH_CHECK_PATH = '/liveness';

void getApp()
  .then(([app, container]) => {
    const config = container.resolve<ConfigType>(SERVICES.CONFIG);
    const port: number = config.get('server.port');
    const logger = container.resolve<Logger>(SERVICES.LOGGER);
    const healthCheck = container.resolve<HealthCheck>(SERVICES.HEALTHCHECK);
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const server = createTerminus(createServer(app), {
      healthChecks: {
        [HEALTH_CHECK_PATH]: healthCheck,
        onSignal: container.resolve('onSignal'),
      },
      beforeShutdown: async () => {
        return new Promise((resolve) => {
          setTimeout(resolve, SHUTDOWN_TIMEOUT_MS);
        });
      },
      headers: {
        /* eslint-disable @typescript-eslint/naming-convention */
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        /* eslint-enable @typescript-eslint/naming-convention */
      },
    });

    server.listen(port, () => {
      logger.info(`app started on port ${port}`);
    });
  })
  .catch((error: Error) => {
    console.error('😢 - failed initializing the server');
    console.error(error);
  });
