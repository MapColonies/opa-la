import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import type { components } from 'auth-openapi';
import { ASSET_TYPES, ENVIRONMENTS, type AssetDraft } from './draft';

type AssetType = components['schemas']['assetType'];

interface AssetMetadataFieldsProps {
  draft: AssetDraft;
  onChange: (changes: Partial<AssetDraft>) => void;
  uriError: string | null;
  disabled?: boolean;
}

/** The editable metadata, shared by the asset page and the create page so the two cannot drift. */
export const AssetMetadataFields = ({ draft, onChange, uriError, disabled = false }: AssetMetadataFieldsProps) => (
  <>
    <div className="flex flex-wrap items-end gap-6">
      <div className="space-y-1">
        <Label htmlFor="asset-type">Asset type</Label>
        <Select value={draft.type} onValueChange={(value) => onChange({ type: value as AssetType })} disabled={disabled}>
          <SelectTrigger id="asset-type" className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSET_TYPES.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="asset-uri">URI</Label>
        <Input
          id="asset-uri"
          className="w-[280px]"
          value={draft.uri}
          onChange={(event) => onChange({ uri: event.target.value })}
          disabled={disabled}
          aria-invalid={uriError !== null}
        />
      </div>

      <fieldset className="space-y-1">
        <legend className="text-sm font-medium">Targeted environments</legend>
        <div className="flex items-center gap-4 pt-1">
          {ENVIRONMENTS.map((environment) => (
            <div key={environment} className="flex items-center gap-2">
              <Checkbox
                id={`environment-${environment}`}
                checked={draft.environment.includes(environment)}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  onChange({
                    environment: checked === true ? [...draft.environment, environment] : draft.environment.filter((value) => value !== environment),
                  })
                }
              />
              <Label htmlFor={`environment-${environment}`}>{environment}</Label>
            </div>
          ))}
        </div>
        {/* Permitted, and a valid work-in-progress state, but worth saying out loud. */}
        {draft.environment.length === 0 && <p className="text-xs text-muted-foreground">No targeted environments — this asset reaches no bundle.</p>}
      </fieldset>

      <div className="flex items-center gap-2 pb-1">
        <Switch id="asset-template" checked={draft.isTemplate} disabled={disabled} onCheckedChange={(checked) => onChange({ isTemplate: checked })} />
        <Label htmlFor="asset-template">Template asset</Label>
      </div>
    </div>

    {uriError !== null && <p className="text-sm text-destructive">{uriError}</p>}
  </>
);
