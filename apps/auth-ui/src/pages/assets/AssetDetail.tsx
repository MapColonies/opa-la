import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { components } from 'auth-openapi';
import { ArrowLeft, GitCompare, Loader2, Save } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AssetDiffEditor, AssetEditor } from '../../components/asset-editor';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { getFetchClient } from '../../fetch';
import { MAX_ENCODED_BYTES, decodeAssetContent, encodeAssetContent, estimateEncodedSize } from '../../lib/asset-content';
import { AssetMetadataFields } from './AssetMetadataFields';
import { AssetVersionSelect } from './AssetVersionSelect';
import { draftOf, isDirty, type AssetDraft, type AssetUpsertBody } from './draft';
import { resolveEditorLanguage } from './language';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { validateUri } from './validation';

const CONFLICT_STATUS = 409;

type Asset = components['schemas']['asset'];

/** Warn before the api does, so a large asset fails here with an explanation rather than as an opaque server error. */
const SIZE_WARNING_BYTES = MAX_ENCODED_BYTES * 0.9;

const asKilobytes = (bytes: number): string => `${Math.round(bytes / 1024)} KB`;

/** A save the server refused. The status is what tells a stale asset version from anything else. */
class SaveFailure extends Error {
  public constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

interface AssetDetailProps {
  /** The stored asset this page is editing against — the latest asset version. */
  asset: Asset;
  /** Every asset version row the api returned for this name, latest first. */
  versions: Asset[];
}

export const AssetDetail = ({ asset, versions }: AssetDetailProps) => {
  const queryClient = useQueryClient();

  const stored = decodeAssetContent(asset.value);
  const [draft, setDraft] = useState<AssetDraft>(() => draftOf(asset, stored.text));
  const [showDiff, setShowDiff] = useState(false);
  const [conflictedVersion, setConflictedVersion] = useState<number | null>(null);

  const change = (changes: Partial<AssetDraft>) => setDraft((current) => ({ ...current, ...changes }));

  const uriError = validateUri(draft.uri);
  const dirty = isDirty(draft, asset, stored.text);
  const language = resolveEditorLanguage(draft.type, asset.name);

  const encodedSize = estimateEncodedSize(draft.content);
  const overSizeLimit = encodedSize > MAX_ENCODED_BYTES;

  const save = useMutation({
    mutationFn: async (body: AssetUpsertBody) => {
      const { data, error, response } = await getFetchClient().POST('/asset', { body: body as Asset });
      if (error !== undefined || data === undefined) throw new SaveFailure(response.status, error?.message ?? 'The asset was not saved.');
      return data;
    },
    onSuccess: () => {
      toast.success(`Saved ${asset.name}`);
      // Both, so the list and this page reflect the change on return.
      queryClient.invalidateQueries({ queryKey: ['get', '/asset'] });
      queryClient.invalidateQueries({ queryKey: ['get', '/asset/{assetName}'] });
    },
    onError: (failure) => {
      if (!(failure instanceof SaveFailure) || failure.status !== CONFLICT_STATUS) return;

      // Nothing was merged and nothing is discarded: the working content stays put, the
      // stored content is refetched, and the two go side by side in the diff.
      setConflictedVersion(asset.version);
      setShowDiff(true);
      queryClient.invalidateQueries({ queryKey: ['get', '/asset/{assetName}'] });
    },
  });

  const canSave = dirty && uriError === null && stored.isValidText && !overSizeLimit && !save.isPending;

  const submit = () => {
    if (!canSave) return;

    setConflictedVersion(null);

    save.mutate({
      name: asset.name,
      // The asset version that was loaded, as the concurrency token.
      version: asset.version,
      value: encodeAssetContent(draft.content),
      uri: draft.uri,
      type: draft.type,
      isTemplate: draft.isTemplate,
      environment: draft.environment,
    });
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <UnsavedChangesDialog when={dirty} />

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
          <Fact label="Created" value={formatCreatedAt(asset.createdAt)} />
        </dl>

        <AssetVersionSelect assetName={asset.name} versions={versions} selectedVersion={asset.version} latestVersion={asset.version} />

        <AssetMetadataFields draft={draft} onChange={change} uriError={uriError} disabled={!stored.isValidText} />

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

        {conflictedVersion !== null && (
          <Alert variant="destructive">
            <AlertTitle>Conflict: this asset moved on while you were editing</AlertTitle>
            <AlertDescription>
              The save declared asset version {conflictedVersion}, which is no longer the latest. Nothing was merged and none of your edits were
              discarded — they are on the right of the diff, against the stored content on the left. Re-apply what you need, then save again.
            </AlertDescription>
          </Alert>
        )}

        {save.isError && conflictedVersion === null && (
          <Alert variant="destructive">
            <AlertTitle>Save failed</AlertTitle>
            <AlertDescription>{save.error.message}</AlertDescription>
          </Alert>
        )}

        {overSizeLimit ? (
          <Alert variant="destructive">
            <AlertTitle>Too large to save</AlertTitle>
            <AlertDescription>
              This content encodes to {asKilobytes(encodedSize)}, over the api&apos;s {asKilobytes(MAX_ENCODED_BYTES)} request limit. Shorten it
              before saving.
            </AlertDescription>
          </Alert>
        ) : (
          encodedSize > SIZE_WARNING_BYTES && (
            <Alert>
              <AlertTitle>Approaching the request size limit</AlertTitle>
              <AlertDescription>
                This content encodes to {asKilobytes(encodedSize)} of the api&apos;s {asKilobytes(MAX_ENCODED_BYTES)} request limit.
              </AlertDescription>
            </Alert>
          )
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
