import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { siteApis } from '../fetch';
import { useSiteLiveness } from '../hooks/useSiteLiveness';
import { LivenessIndicator } from './ui/liveness-indicator';

const availableSites = Object.keys(siteApis || {});

interface SiteSelectionProps {
  selectedSites: string[];
  setSelectedSites: (sites: string[]) => void;
}

export const SiteSelection = ({ selectedSites, setSelectedSites }: SiteSelectionProps) => {
  const currentSite = localStorage.getItem('selectedSite') || '';
  const liveness = useSiteLiveness(availableSites);

  const handleSiteToggle = (site: string) => {
    setSelectedSites(selectedSites.includes(site) ? selectedSites.filter((s) => s !== site) : [...selectedSites, site]);
  };

  return (
    <div className="grid grid-cols-4 items-start gap-4">
      <Label className="text-right">Sites</Label>
      <div className="col-span-3">
        <div className="flex flex-wrap gap-2">
          {availableSites.map((site) => (
            <div key={site} className="flex items-center gap-1.5">
              <Checkbox id={`site-${site}`} checked={selectedSites.includes(site)} onCheckedChange={() => handleSiteToggle(site)} />
              <Label htmlFor={`site-${site}`} className="text-sm flex items-center gap-1">
                {site}
                {site === currentSite && <span className="text-muted-foreground">(current)</span>}
                <LivenessIndicator isAlive={liveness[site] ?? false} />
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { availableSites };
