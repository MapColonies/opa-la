import type { components } from 'auth-openapi';
import { useNavigate } from 'react-router-dom';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

type Asset = components['schemas']['asset'];

interface AssetVersionSelectProps {
  assetName: string;
  /** Every asset version row the api returned for this name, latest first. */
  versions: Asset[];
  selectedVersion: number;
  latestVersion: number;
}

/**
 * Which asset version is on screen, as a url search param so it stays linkable.
 *
 * Today the write path leaves exactly one row per name, so this usually lists one entry.
 * That is recorded in the spec's Further Notes as a probable backend bug; the dropdown
 * fills in with no change here if it is corrected.
 */
export const AssetVersionSelect = ({ assetName, versions, selectedVersion, latestVersion }: AssetVersionSelectProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-1">
      <Label htmlFor="asset-version">Asset version</Label>
      <Select
        value={String(selectedVersion)}
        onValueChange={(value) => {
          const target = `/assets/${encodeURIComponent(assetName)}`;
          void navigate(Number(value) === latestVersion ? target : `${target}?version=${value}`);
        }}
      >
        <SelectTrigger id="asset-version" className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {versions.map((version) => (
            <SelectItem key={version.version} value={String(version.version)}>
              {version.version === latestVersion ? `${version.version} (latest)` : version.version}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
