import { useQueryClient } from '@tanstack/react-query';
import type { components } from 'auth-openapi';
import { ArrowLeft, GitCompare, Loader2, Save } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AssetDiffEditor, AssetEditor } from '../../components/asset-editor';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { $api } from '../../fetch';
import { decodeAssetContent, encodeAssetContent } from '../../lib/asset-content';
import { ASSET_TYPES, ENVIRONMENTS, draftOf, isDirty, type AssetDraft, type AssetUpsertBody } from './draft';
import { resolveEditorLanguage } from './language';
import { validateUri } from './uri';

type Asset = components['schemas']['asset'];
type AssetType = components['schemas']['assetType'];
type Environment = components['schemas']['environment'];

interface AssetDetailProps {
  /** The stored asset this page is editing against — the latest asset version. */
  asset: Asset;
}

export const AssetDetail = ({ asset }: AssetDetailProps) => {
  const queryClient = useQueryClient();

  const stored = decodeAssetContent(asset.value);
  const [draft, setDraft] = useState<AssetDraft>(() => draftOf(asset, stored.text));
  const [showDiff, setShowDiff] = useState(false);

  const change = (changes: Partial<AssetDraft>) => setDraft((current) => ({ ...current, ...changes }));

  const uriError = validateUri(draft.uri);
  const dirty = isDirty(draft, asset, stored.text);
  const language = resolveEditorLanguage(draft.type, asset.name);

  const save = $api.useMutation('post', '/asset', {
    onSuccess: () => {
      toast.success(`Saved ${asset.name}`);
      // Both, so the list and this page reflect the change on return.
      queryClient.invalidateQueries({ queryKey: ['get', '/asset'] });
      queryClient.invalidateQueries({ queryKey: ['get', '/asset/{assetName}'] });
    },
  });

  const canSave = dirty && uriError === null && stored.isValidText && !save.isPending;

  const submit = () => {
    if (!canSave) return;

    const body: AssetUpsertBody = {
      name: asset.name,
      // The asset version that was loaded, as the concurrency token.
      version: asset.version,
      value: encodeAssetContent(draft.content),
      uri: draft.uri,
      type: draft.type,
      isTemplate: draft.isTemplate,
      environment: draft.environment,
    };

    save.mutate({ body: body as Asset });
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="space-y-3">
        <Link to="/assets" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to assets
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{asset.name}</h1>
            {draft.isTemplate && <Badge variant="secondary">Template</Badge>}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowDiff((shown) => !shown)} disabled={!dirty}>
              <GitCompare className="mr-2 h-4 w-4" />
              {showDiff ? 'Back to editor' : 'Review changes'}
            </Button>
            <Button onClick={submit} disabled={!canSave}>
              {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>

        {/* Shown, never edited: renaming would create a second asset, and there is no delete
            to remove the original. */}
        <dl className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
          <Fact label="Asset version" value={String(asset.version)} />
          <Fact label="Created" value={formatCreatedAt(asset.createdAt)} />
        </dl>

        <div className="flex flex-wrap items-end gap-6">
          <div className="space-y-1">
            <Label htmlFor="asset-type">Asset type</Label>
            <Select value={draft.type} onValueChange={(value) => change({ type: value as AssetType })} disabled={!stored.isValidText}>
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
              onChange={(event) => change({ uri: event.target.value })}
              disabled={!stored.isValidText}
              aria-invalid={uriError !== null}
            />
          </div>

          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">Environments</legend>
            <div className="flex items-center gap-4 pt-1">
              {ENVIRONMENTS.map((environment) => (
                <div key={environment} className="flex items-center gap-2">
                  <Checkbox
                    id={`environment-${environment}`}
                    checked={draft.environment.includes(environment)}
                    disabled={!stored.isValidText}
                    onCheckedChange={(checked) =>
                      change({
                        environment:
                          checked === true ? [...draft.environment, environment] : draft.environment.filter((value) => value !== environment),
                      })
                    }
                  />
                  <Label htmlFor={`environment-${environment}`}>{environment}</Label>
                </div>
              ))}
            </div>
            {/* Permitted, and a valid work-in-progress state, but worth saying out loud. */}
            {draft.environment.length === 0 && <p className="text-xs text-muted-foreground">No environments — this asset reaches no bundle.</p>}
          </fieldset>

          <div className="flex items-center gap-2 pb-1">
            <Switch
              id="asset-template"
              checked={draft.isTemplate}
              disabled={!stored.isValidText}
              onCheckedChange={(checked) => change({ isTemplate: checked })}
            />
            <Label htmlFor="asset-template">Template asset</Label>
          </div>
        </div>

        {uriError !== null && <p className="text-sm text-destructive">{uriError}</p>}

        {draft.type !== asset.type && (
          <Alert>
            <AlertTitle>Asset type changed to {draft.type}</AlertTitle>
            <AlertDescription>
              Changing the type does not change the content. This asset&apos;s content probably needs rewriting to match.
            </AlertDescription>
          </Alert>
        )}

        {!stored.isValidText && (
          <Alert variant="destructive">
            <AlertTitle>Opened read-only</AlertTitle>
            <AlertDescription>
              This asset&apos;s content is not valid text. Saving it back would replace the original bytes with a mangled copy, and there is no way to
              restore it.
            </AlertDescription>
          </Alert>
        )}

        {save.isError && (
          <Alert variant="destructive">
            <AlertTitle>Save failed</AlertTitle>
            <AlertDescription>{save.error?.message ?? 'The asset was not saved.'}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="min-h-0 flex-1">
        {showDiff ? (
          <AssetDiffEditor original={stored.text} modified={draft.content} language={language} isTemplate={draft.isTemplate} />
        ) : (
          <AssetEditor
            value={draft.content}
            language={language}
            isTemplate={draft.isTemplate}
            readOnly={!stored.isValidText}
            onChange={(content) => change({ content })}
            onSave={submit}
          />
        )}
      </div>
    </div>
  );
};

const Fact = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-2">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="font-medium">{value}</dd>
  </div>
);

const formatCreatedAt = (createdAt: string): string => {
  const parsed = new Date(createdAt);
  return Number.isNaN(parsed.getTime()) ? createdAt : parsed.toLocaleString();
};
