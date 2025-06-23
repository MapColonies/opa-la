import React, { createContext, useContext, useEffect, useState } from 'react';
import { NetworkConfig, SiteConfig } from '../types/config';
import { configLoader } from '../config/loader';
import { GlobalLoading } from '../components/internal/GlobalLoading';
import { Error } from '../components/ui/error';

interface ConfigContextType {
  config: NetworkConfig | null;
  selectedConfig: SiteConfig | null;
  selectedEnv: string | null;
  loading: boolean;
  error: Error | null;
  setSelectedEnv: (envKey: string) => void;
}

const ConfigContext = createContext<ConfigContextType>({
  config: null,
  selectedConfig: null,
  selectedEnv: null,
  loading: true,
  error: null,
  setSelectedEnv: () => {},
});

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<NetworkConfig | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<SiteConfig | null>(null);
  const [selectedEnv, setSelectedEnvState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const setSelectedEnv = (envKey: string) => {
    localStorage.setItem('selectedEnv', envKey);
    setSelectedEnvState(envKey);
  };

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const loadedConfig = await configLoader.loadConfig();
        setConfig(loadedConfig);

        const selectedSite = localStorage.getItem('selectedSite');
        const storedEnv = localStorage.getItem('selectedEnv');

        if (selectedSite) {
          const siteConfig = loadedConfig[selectedSite];
          if (siteConfig) {
            setSelectedConfig(siteConfig);
            if (storedEnv) {
              setSelectedEnvState(storedEnv);
            } else if (siteConfig.envs && siteConfig.envs.length > 0 && siteConfig.envs[0]?.envKey) {
              setSelectedEnv(siteConfig.envs[0].envKey);
            }
          }
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  if (loading) {
    return <GlobalLoading text="Loading configuration..." />;
  }

  if (error) {
    return <Error title="Configuration Error" message={error.message || 'Failed to load configuration. Please try again later.'} />;
  }

  return <ConfigContext.Provider value={{ config, selectedConfig, selectedEnv, loading, error, setSelectedEnv }}>{children}</ConfigContext.Provider>;
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new TypeError('useConfig must be used within a ConfigProvider');
  }
  return context;
};
