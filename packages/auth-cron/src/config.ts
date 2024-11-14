import { type ConfigInstance, config } from '@map-colonies/config';
import { infraOpalaCronV1, type infraOpalaCronV1Type } from '@map-colonies/schemas';

type ConfigType = ConfigInstance<infraOpalaCronV1Type>;

let configInstance: ConfigType | undefined;

/**
 * Initializes the configuration by fetching it from the server.
 * This should only be called from the instrumentation file.
 * @returns A Promise that resolves when the configuration is successfully initialized.
 */
async function initConfig(offlineMode?: boolean): Promise<void> {
  configInstance = await config({
    configServerUrl: 'http://localhost:8080',
    schema: infraOpalaCronV1,
    offlineMode: offlineMode,
  });
}

function getConfig(): ConfigType {
  if (!configInstance) {
    throw new Error('config not initialized');
  }
  return configInstance;
}

export { getConfig, initConfig, ConfigType };
