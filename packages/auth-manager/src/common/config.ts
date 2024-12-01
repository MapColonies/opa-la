import { type ConfigInstance, config } from '@map-colonies/config';
import { infraOpalaManagerV1, type infraOpalaManagerV1Type } from '@map-colonies/schemas';

type ConfigType = ConfigInstance<infraOpalaManagerV1Type>;

let configInstance: ConfigType | undefined;

/**
 * Initializes the configuration by fetching it from the server.
 * This should only be called from the instrumentation file.
 * @returns A Promise that resolves when the configuration is successfully initialized.
 */
async function initConfig(): Promise<void> {
  configInstance = await config({
    schema: infraOpalaManagerV1,
  });
}

function getConfig(): ConfigType {
  if (!configInstance) {
    throw new Error('config not initialized');
  }
  return configInstance;
}

export { getConfig, initConfig, ConfigType };
