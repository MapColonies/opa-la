import createClient from 'openapi-react-query';
import createFetchClient from 'openapi-fetch';
import type { paths } from '../types/schema';
import { configLoader } from '../config/loader';
import { NetworkConfig } from '../types/config';

const FALLBACK_BASE_URL = 'http://localhost:8080/';

const getDefaultBaseUrl = (): string => {
  try {
    const config = configLoader.getConfig();
    const firstSiteKey = Object.keys(config)[0];
    if (firstSiteKey && config[firstSiteKey]?.url) {
      console.log(`Using default base URL from config: ${config[firstSiteKey].url}`);
      return config[firstSiteKey].url;
    }
  } catch (error) {
    console.error('Failed to get default base URL:', error);
  }
  console.log(`Falling back to hardcoded URL: ${FALLBACK_BASE_URL}`);
  return FALLBACK_BASE_URL;
};

const getCurrentBaseUrl = (): string => {
  const storedBaseUrl = localStorage.getItem('currentBaseUrl');
  if (storedBaseUrl) return storedBaseUrl;

  const selectedSite = localStorage.getItem('selectedSite');
  if (!selectedSite) return getDefaultBaseUrl();

  const siteConfig = localStorage.getItem(`siteConfig_${selectedSite}`);
  if (!siteConfig) return getDefaultBaseUrl();

  try {
    const config = JSON.parse(siteConfig);
    const selectedEnv = localStorage.getItem('selectedEnv');
    if (selectedEnv && config.envs) {
      const envConfig = config.envs.find((env: any) => env.envKey === selectedEnv);
      if (envConfig) {
        return envConfig.opaUrl;
      }
    }
    return config.url || getDefaultBaseUrl();
  } catch (e) {
    return getDefaultBaseUrl();
  }
};

let defaultFetchClient = createFetchClient<paths>({
  baseUrl: getCurrentBaseUrl(),
});

export let $api = createClient(defaultFetchClient);

const recreateDefaultApi = () => {
  defaultFetchClient = createFetchClient<paths>({
    baseUrl: getCurrentBaseUrl(),
  });
  $api = createClient(defaultFetchClient);
};

export const createSiteApis = async () => {
  try {
    const config = await configLoader.loadConfig();
    recreateDefaultApi();
    return createApiClientsFromConfig(config);
  } catch (error) {
    console.error('Failed to create site APIs:', error);
    return { $api };
  }
};

export const createApiClientsFromConfig = (config: NetworkConfig) => {
  const siteApis: Record<string, typeof $api> = {};

  Object.entries(config).forEach(([siteName, siteConfig]) => {
    const baseUrl = siteConfig.url;

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

export const getAvailableSites = () => Object.keys(siteApis || {});
