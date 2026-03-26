import { NetworkConfig } from '../types/config';

class ConfigLoader {
  private static instance: ConfigLoader;
  private config: NetworkConfig | null = null;

  private constructor() {}

  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  async loadConfig(): Promise<NetworkConfig> {
    try {
      const configUrl = import.meta.env.VITE_CONFIG_URL;
      if (configUrl) {
        const response = await fetch(configUrl);
        const configData = await response.json();
        this.config = configData as NetworkConfig;
        return this.config;
      }

      const response = await fetch('/config.json');
      const configData = await response.json();
      this.config = configData as NetworkConfig;
      return this.config;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      throw new Error('Failed to load configuration');
    }
  }

  getConfig(): NetworkConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }
    return this.config;
  }
}

export const configLoader = ConfigLoader.getInstance();
