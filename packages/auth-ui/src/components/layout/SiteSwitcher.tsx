import { useConfig } from '../../contexts/ConfigProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { updateApiBaseUrl } from '../../fetch/client';

export const SiteSwitcher = () => {
  const { config } = useConfig();

  if (!config) return null;

  const handleSiteChange = (siteName: string) => {
    localStorage.setItem('selectedSite', siteName);

    const siteConfig = config[siteName];
    if (siteConfig) {
      localStorage.setItem(`siteConfig_${siteName}`, JSON.stringify(siteConfig));

      updateApiBaseUrl(siteConfig.url);
    }
  };

  const selectedSite = localStorage.getItem('selectedSite') || Object.keys(config)[0];

  return (
    <div className="flex items-center gap-2">
      <Select defaultValue={selectedSite} onValueChange={handleSiteChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue>{selectedSite}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(config).map(([siteKey, siteConfig]) => (
            <SelectItem key={siteKey} value={siteKey}>
              <div className="flex flex-col">
                <span>{siteConfig.name}</span>
                <span className="text-xs text-muted-foreground">{siteConfig.url}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
