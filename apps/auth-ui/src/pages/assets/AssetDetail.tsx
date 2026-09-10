import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { components } from 'auth-openapi';
import { ArrowLeft, GitCompare, Loader2, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AssetDiffEditor, AssetEditor } from '../../components/asset-editor';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { decodeAssetContent, encodeAssetContent, isOverSizeLimit } from '../../lib/asset-content';
import { formatTimestamp } from '../../lib/utils';
import { AssetMetadataFields } from './AssetMetadataFields';
import { ContentSizeAlert } from './ContentSizeAlert';
import { AssetVersionSelect } from './AssetVersionSelect';
import { draftOf, isDirty, sameDraft, type AssetDraft, type AssetUpsertBody } from './draft';
import { resolveEditorLanguage } from './language';
import { CONFLICT_STATUS, SaveFailure, saveAsset } from './save';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { validateUri } from './validation';

type Asset = components['schemas']['asset'];

interface AssetDetailProps {
  /** The stored asset this page is editing against — the latest asset version. */
  asset: Asset;
  /** Every asset version row the api returned for this name, latest first. */
  versions: Asset[];
}

export const AssetDetail = ({ asset, versions }: AssetDetailProps) => {
  const queryClient = useQueryClient();

  // Both are O(content) and the content runs to hundreds of kilobytes; neither belongs on every keystroke.
  const stored = useMemo(() => decodeAssetContent(asset.value), [asset.value]);
  const [draft, setDraft] = useState<AssetDraft>(() => draftOf(asset, stored.text));
  const [showDiff, setShowDiff] = useState(false);
  const [conflictedVersion, setConflictedVersion] = useState<number | null>(null);
  /** What the last successful save wrote, so the guard does not fire while the refetch is in flight. */
  const [savedDraft, setSavedDraft] = useState<AssetDraft | null>(null);

  const change = (changes: Partial<AssetDraft>) => setDraft((current) => ({ ...current, ...changes }));

  const uriError = validateUri(draft.uri);
  const dirty = isDirty(draft, asset, stored.text) && !(savedDraft !== null && sameDraft(draft, savedDraft));
  const language = resolveEditorLanguage(draft.type, asset.name);

  const overSizeLimit = isOverSizeLimit(draft.content);

  const save = useMutation({
    mutationFn: saveAsset,
    onSuccess: () => {
      setSavedDraft(draft);
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
          <Fact label="Created" value={formatTimestamp(asset.createdAt)} />
        </dl>

        <AssetVersionSelect versions={versions} selectedVersion={asset.version} />

        {/* Metadata is locked too when the content is not text: any save re-encodes the
            content alongside it, which is the corruption this is guarding against. */}
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

        <ContentSizeAlert content={draft.content} />
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
