import jsLogger, { Logger } from '@map-colonies/js-logger';
import { setLogger } from '@map-colonies/auth-bundler';
import config from 'config';
import { AppConfig } from './config';

const loggerConfig = config.get<AppConfig['telemetry']['logger']>('telemetry.logger');

// eslint-disable-next-line import/exports-last
export const logger: Logger | undefined = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint });

setLogger(logger);
