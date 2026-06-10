import type { Logger } from '@map-colonies/js-logger';
import { jsLogger } from '@map-colonies/js-logger';
import { setLogger } from '@map-colonies/auth-bundler';
import { getConfig } from '../config';

let logger: Logger;

export async function initializeLogger(): Promise<void> {
  const loggerConfig = getConfig().get('telemetry.logger');
  logger = await jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint });

  setLogger(logger);
}

export { logger };
