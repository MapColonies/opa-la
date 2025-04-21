import React, { createContext, useContext, useEffect, useState } from 'react';
import { NetworkConfig, SiteConfig } from '../types/config';
import { configLoader } from '../config/loader';
import { GlobalLoading } from '../components/internal/GlobalLoading';
import { Error } from '../components/ui/error';

interface ConfigContextType {
  config: NetworkConfig | null;
  selectedConfig: SiteConfig | null;
  loading: boolean;
  error: Error | null;
}

const ConfigContext = createContext<ConfigContextType>({
  config: null,
  selectedConfig: null,
  loading: true,
  error: null,
});

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<NetworkConfig | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const loadedConfig = await configLoader.loadConfig();
        setConfig(loadedConfig);

        const selectedSite = localStorage.getItem('selectedSite');
        if (selectedSite) {
          const siteConfig = loadedConfig[selectedSite];
          if (siteConfig) {
            setSelectedConfig(siteConfig);
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

  return <ConfigContext.Provider value={{ config, selectedConfig, loading, error }}>{children}</ConfigContext.Provider>;
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new TypeError('useConfig must be used within a ConfigProvider');
  }
  return context;
};
