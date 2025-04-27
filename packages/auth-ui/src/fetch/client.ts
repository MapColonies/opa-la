import createClient from 'openapi-react-query';
import createFetchClient from 'openapi-fetch';
import type { paths } from '../types/schema';
import { configLoader } from '../config/loader';
import { NetworkConfig } from '../types/config';

const DEFAULT_BASE_URL = 'http://localhost:8080/';

const getCurrentBaseUrl = (): string => {
  const storedBaseUrl = localStorage.getItem('currentBaseUrl');
  if (storedBaseUrl) return storedBaseUrl;

  const selectedSite = localStorage.getItem('selectedSite');
  if (!selectedSite) return DEFAULT_BASE_URL;

  const siteConfig = localStorage.getItem(`siteConfig_${selectedSite}`);
  if (!siteConfig) return DEFAULT_BASE_URL;

  try {
    const config = JSON.parse(siteConfig);
    const selectedEnv = localStorage.getItem('selectedEnv');
    if (selectedEnv && config.envs) {
      const envConfig = config.envs.find((env: any) => env.envKey === selectedEnv);
      if (envConfig) {
        return envConfig.opalaUrl;
      }
    }
    return config.url || DEFAULT_BASE_URL;
  } catch (e) {
    return DEFAULT_BASE_URL;
  }
};

const defaultFetchClient = createFetchClient<paths>({
  baseUrl: getCurrentBaseUrl(),
});

export const $api = createClient(defaultFetchClient);

export const createSiteApis = async () => {
  try {
    const config = await configLoader.loadConfig();
    return createApiClientsFromConfig(config);
  } catch (error) {
    console.error('Failed to create site APIs:', error);
    return { $api };
  }
};

export const createApiClientsFromConfig = (config: NetworkConfig) => {
  const siteApis: Record<string, typeof $api> = {};

  Object.entries(config).forEach(([siteName, siteConfig]) => {
    const selectedEnv = localStorage.getItem('selectedEnv');
    let baseUrl = siteConfig.url;

    if (selectedEnv && siteConfig.envs) {
      const envConfig = siteConfig.envs.find((env) => env.envKey === selectedEnv);
      if (envConfig) {
        baseUrl = envConfig.opalaUrl;
      }
    }

    const fetchClient = createFetchClient<paths>({
      baseUrl,
    });

    siteApis[siteName] = createClient(fetchClient);
  });

  return siteApis;
};

export const updateApiBaseUrl = (baseUrl: string) => {
  localStorage.setItem('currentBaseUrl', baseUrl);
  window.location.reload();
};

export const siteApis = await createSiteApis();
