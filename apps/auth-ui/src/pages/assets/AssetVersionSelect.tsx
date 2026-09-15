import type { components } from 'auth-openapi';
import { useNavigate } from 'react-router-dom';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { environmentsInUseBy } from './working-versions';

type Asset = components['schemas']['asset'];

interface AssetVersionSelectProps {
  /** Every asset version row the api returned for one name, latest first. */
  versions: Asset[];
  selectedVersion: number;
}

/**
 * Which asset version is on screen, as a url search param so it stays linkable.
 *
 * Each entry says what the version is: the latest, or the one an environment's bundle is
 * built from. The two are not always the same version, and a version that is neither is
 * history.
 *
 * Today the write path leaves exactly one row per name, so this usually lists one entry.
 * That is recorded in the spec's Further Notes as a probable backend bug; the dropdown
 * fills in with no change here if it is corrected.
 */
export const AssetVersionSelect = ({ versions, selectedVersion }: AssetVersionSelectProps) => {
  const navigate = useNavigate();

  const latest = versions[0];
  if (!latest) return null;

  const describe = (version: Asset): string => {
    if (version.version === latest.version) return `${version.version} (latest)`;

    const inUse = environmentsInUseBy(version.version, versions);
    return inUse.length === 0 ? String(version.version) : `${version.version} (in use: ${inUse.join(', ')})`;
  };

  return (
    <div className="space-y-1">
      <Label htmlFor="asset-version">Asset version</Label>
      <Select
        value={String(selectedVersion)}
        onValueChange={(value) => {
          const target = `/assets/${encodeURIComponent(latest.name)}`;
          void navigate(Number(value) === latest.version ? target : `${target}?version=${value}`);
        }}
      >
        <SelectTrigger id="asset-version" className="w-[220px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {versions.map((version) => (
            <SelectItem key={version.version} value={String(version.version)}>
              {describe(version)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
