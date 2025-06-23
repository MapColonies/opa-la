import { useState, useEffect } from 'react';
import { useConfig } from '../contexts/ConfigProvider';

interface SiteLiveness {
  [key: string]: boolean;
}

export const useSiteLiveness = (sites: string[]) => {
  const [liveness, setLiveness] = useState<SiteLiveness>({});
  const { config } = useConfig();

  useEffect(() => {
    const checkLiveness = async (site: string) => {
      try {
        const siteConfig = config?.[site];
        if (!siteConfig?.url) return false;

        const response = await fetch(`${siteConfig.url}/liveness`);
        const data = await response.json();
        return data.status === 'ok';
      } catch (error) {
        return false;
      }
    };

    const pollSites = async () => {
      const newLiveness: SiteLiveness = {};
      for (const site of sites) {
        newLiveness[site] = await checkLiveness(site);
      }
      setLiveness(newLiveness);
    };

    pollSites();

    const interval = setInterval(pollSites, 3000);

    return () => clearInterval(interval);
  }, [sites, config]);

  return liveness;
};
