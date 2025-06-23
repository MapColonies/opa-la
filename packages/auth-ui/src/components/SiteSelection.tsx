import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { siteApis } from '../fetch';
import { useSiteLiveness } from '../hooks/useSiteLiveness';
import { LivenessIndicator } from './ui/liveness-indicator';

export const getAvailableSites = () => Object.keys(siteApis || {});

interface SiteSelectionProps {
  selectedSites: string[];
  setSelectedSites: (sites: string[]) => void;
}

export const SiteSelection = ({ selectedSites, setSelectedSites }: SiteSelectionProps) => {
  const currentSite = localStorage.getItem('selectedSite') || '';
  const availableSites = getAvailableSites();
  const liveness = useSiteLiveness(availableSites);

  const handleSiteToggle = (site: string) => {
    setSelectedSites(selectedSites.includes(site) ? selectedSites.filter((s) => s !== site) : [...selectedSites, site]);
  };

  const handleSelectAll = () => {
    const otherSites = availableSites.filter((site) => site !== currentSite);
    if (selectedSites.length === otherSites.length) {
      setSelectedSites([]);
    } else {
      setSelectedSites(otherSites);
    }
  };

  const otherSites = availableSites.filter((site) => site !== currentSite);
  const allSelected = otherSites.length > 0 && selectedSites.length === otherSites.length;

  if (otherSites.length === 0) {
    return <div className="text-sm text-muted-foreground">No other sites available.</div>;
  }

  return (
    <div className="space-y-3">
      {otherSites.length > 1 && (
        <div className="flex items-center mb-2 pb-2 border-b">
          <Checkbox id="select-all-sites" checked={allSelected} onCheckedChange={handleSelectAll} />
          <Label htmlFor="select-all-sites" className="text-sm ml-2 font-medium cursor-pointer">
            {allSelected ? 'Deselect All' : 'Select All'} ({otherSites.length} sites)
          </Label>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {otherSites.map((site) => (
          <div key={site} className="flex items-center gap-1.5">
            <Checkbox id={`site-${site}`} checked={selectedSites.includes(site)} onCheckedChange={() => handleSiteToggle(site)} />
            <Label htmlFor={`site-${site}`} className="text-sm flex items-center gap-1 cursor-pointer">
              {site}
              <LivenessIndicator isAlive={liveness[site] ?? false} />
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export const availableSites = getAvailableSites();
