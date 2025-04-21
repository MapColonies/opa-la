import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { siteApis } from '../fetch';

// Move availableSites outside component to prevent recreation on each render
const availableSites = Object.keys(siteApis || {});

interface SiteSelectionProps {
  selectedSites: string[];
  setSelectedSites: (sites: string[]) => void;
}

export const SiteSelection = ({ selectedSites, setSelectedSites }: SiteSelectionProps) => {
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
              <Label htmlFor={`site-${site}`} className="text-sm">
                {site}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Export availableSites for use in other components
export { availableSites };
