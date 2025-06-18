import { type ConfigInstance, config } from '@map-colonies/config';
import { infraOpalaCronV2, type infraOpalaCronV2Type } from '@map-colonies/schemas';

type ConfigType = ConfigInstance<infraOpalaCronV2Type>;

let configInstance: ConfigType | undefined;

/**
 * Initializes the configuration by fetching it from the server.
 * This should only be called from the instrumentation file.
 * @returns A Promise that resolves when the configuration is successfully initialized.
 */
async function initConfig(): Promise<void> {
  configInstance = await config({
    schema: infraOpalaCronV2,
  });
}

function getConfig(): ConfigType {
  if (!configInstance) {
    throw new Error('config not initialized');
  }
  return configInstance;
}

export { getConfig, initConfig, type ConfigType };
