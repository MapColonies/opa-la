import jsLogger, { Logger } from '@map-colonies/js-logger';
import { setLogger } from '@map-colonies/auth-bundler';
import { getConfig } from '../config';

const loggerConfig = getConfig().get('telemetry.logger');

const logger: Logger | undefined = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint });

setLogger(logger);
export { logger };
