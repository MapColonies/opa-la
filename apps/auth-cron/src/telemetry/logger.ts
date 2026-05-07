import type { Logger } from '@map-colonies/js-logger';
import { jsLogger } from '@map-colonies/js-logger';
import { setLogger } from '@map-colonies/auth-bundler';
import { getConfig } from '../config';

const loggerConfig = getConfig().get('telemetry.logger');

let logger: Logger;

export async function initializeLogger(): Promise<void> {
  const logger: Logger | undefined = await jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint });

  setLogger(logger);
}

export { logger };
