import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { components } from 'auth-openapi';
import { ArrowLeft, GitCompare, Loader2, Pencil, Save, Undo2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { AssetDiffEditor, AssetEditor } from '../../components/asset-editor';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { decodeAssetContent, encodeAssetContent, isOverSizeLimit } from '../../lib/asset-content';
import { formatTimestamp } from '../../lib/utils';
import { AssetMetadataFields } from './AssetMetadataFields';
import { AssetVersionSelect } from './AssetVersionSelect';
import { ConfirmDialog } from './ConfirmDialog';
import { ContentSizeAlert } from './ContentSizeAlert';
import { draftOf, isDirty, sameDraft, type AssetDraft } from './draft';
import { resolveEditorLanguage } from './language';
import { CONFLICT_STATUS, SaveFailure, saveAsset } from './save';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { validateUri } from './validation';
import { environmentsInUseBy } from './working-versions';

type Asset = components['schemas']['asset'];

/** Which irreversible step is waiting on a yes, if any. */
type Pending = 'save' | 'discard' | null;

/** Left behind by the create page, so this page can say what just happened. */
interface ArrivedFromCreate {
  createdVersion?: number;
}

interface AssetDetailProps {
  /** The stored asset this page is editing against — the latest asset version. */
  asset: Asset;
  /** Every asset version row the api returned for this name, latest first. */
  versions: Asset[];
}

export const AssetDetail = ({ asset, versions }: AssetDetailProps) => {
  const queryClient = useQueryClient();
  const createdVersion = (useLocation().state as ArrivedFromCreate | null)?.createdVersion;

  // Both are O(content) and the content runs to hundreds of kilobytes; neither belongs on every keystroke.
  const stored = useMemo(() => decodeAssetContent(asset.value), [asset.value]);
  const [draft, setDraft] = useState<AssetDraft>(() => draftOf(asset, stored.text));
  /** Read-only until asked otherwise: an asset opens to be looked at more often than to be changed. */
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [conflictedVersion, setConflictedVersion] = useState<number | null>(null);
  /** What the last successful save wrote, so the guard does not fire while the refetch is in flight. */
  const [savedDraft, setSavedDraft] = useState<AssetDraft | null>(null);
  /** The asset version the last successful save produced, which is the only proof a save landed. */
  const [savedVersion, setSavedVersion] = useState<number | null>(null);

  const change = (changes: Partial<AssetDraft>) => setDraft((current) => ({ ...current, ...changes }));

  const uriError = validateUri(draft.uri);
  const dirty = isDirty(draft, asset, stored.text) && !(savedDraft !== null && sameDraft(draft, savedDraft));
  const language = resolveEditorLanguage(draft.type, asset.name);

  const overSizeLimit = isOverSizeLimit(draft.content);
  const inUse = environmentsInUseBy(asset.version, versions);

  const save = useMutation({
    mutationFn: saveAsset,
    onSuccess: (written) => {
      setSavedDraft(draft);
      setSavedVersion(written.version);
      // Back to reading. The edit is done, and what it produced is on screen behind it.
      setEditing(false);
      setShowDiff(false);
      toast.success(`Saved ${asset.name}`);
      // Both, so the list and this page reflect the change on return.
      queryClient.invalidateQueries({ queryKey: ['get', '/asset'] });
      queryClient.invalidateQueries({ queryKey: ['get', '/asset/{assetName}'] });
    },
    onError: (failure) => {
      if (!(failure instanceof SaveFailure) || failure.status !== CONFLICT_STATUS) return;

      // Nothing was merged and nothing is discarded: the working content stays put, the
      // stored content is refetched, and the two go side by side in the diff. Edit mode
      // stays open, because re-applying the edits is the only way out of this.
      setConflictedVersion(asset.version);
      setShowDiff(true);
      queryClient.invalidateQueries({ queryKey: ['get', '/asset/{assetName}'] });
    },
  });

  const editable = stored.isValidText;
  const canSave = editing && dirty && uriError === null && editable && !overSizeLimit && !save.isPending;

  const startEditing = () => {
    if (!editable) return;
    setSavedVersion(null);
    setEditing(true);
  };

  /** Save asks first: there is no content history, so the version it replaces is gone. */
  const requestSave = () => {
    if (!canSave) return;
    setPending('save');
  };

  const confirmSave = () => {
    setPending(null);
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

  /** Leaving edit mode with edits in hand loses them, so that asks first too. */
  const requestCancel = () => {
    if (!dirty) {
      setEditing(false);
      setShowDiff(false);
      return;
    }
    setPending('discard');
  };

  const confirmDiscard = () => {
    setPending(null);
    setDraft(draftOf(asset, stored.text));
    setConflictedVersion(null);
    setShowDiff(false);
    setEditing(false);
  };

  const landed =
    savedVersion !== null
      ? {
          title: `Saved — ${asset.name} is now asset version ${savedVersion}`,
          detail: 'Each environment it targets picks this up the next time its bundle is built.',
        }
      : createdVersion !== undefined
        ? {
            title: `Created — ${asset.name} is now asset version ${createdVersion}`,
            detail: 'This is the asset’s own page. Choose Edit to carry on working on it.',
          }
        : null;

  return (
    <div className="flex h-full flex-col gap-4">
      <UnsavedChangesDialog when={dirty} />

      <ConfirmDialog
        open={pending === 'save'}
        title={`Save changes to ${asset.name}?`}
        description={`This writes asset version ${asset.version + 1}. An asset keeps no content history, so what is stored now cannot be brought back — review the diff first if you have not.`}
        confirmLabel="Save changes"
        cancelLabel="Keep editing"
        onConfirm={confirmSave}
        onCancel={() => setPending(null)}
      />

      <ConfirmDialog
        open={pending === 'discard'}
        title="Discard your changes?"
        description="Your edits are not saved and are not kept as a draft. Discarding returns this asset to its stored content."
        confirmLabel="Discard changes"
        confirmVariant="destructive"
        cancelLabel="Keep editing"
        onConfirm={confirmDiscard}
        onCancel={() => setPending(null)}
      />

      <div className="space-y-3">
        <Link to="/assets" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to assets
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{asset.name}</h1>
            {draft.isTemplate && <Badge variant="secondary">Template</Badge>}
            {/* Latest usually is what is deployed, but only for the environments it targets. */}
            {inUse.length > 0 && <Badge>In use: {inUse.join(', ')}</Badge>}
          </div>

          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={() => setShowDiff((shown) => !shown)} disabled={!dirty}>
                  <GitCompare className="mr-2 h-4 w-4" />
                  {showDiff ? 'Back to editor' : 'Review changes'}
                </Button>
                <Button variant="outline" onClick={requestCancel} disabled={save.isPending}>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={requestSave} disabled={!canSave}>
                  {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save
                </Button>
              </>
            ) : (
              <Button onClick={startEditing} disabled={!editable}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Shown, never edited: renaming would create a second asset, and there is no delete
            to remove the original. */}
        <dl className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
          <Fact label="Created" value={formatTimestamp(asset.createdAt)} />
        </dl>

        <AssetVersionSelect versions={versions} selectedVersion={asset.version} />

        {/* Metadata follows the editor in and out of edit mode. It is locked when the content
            is not text too: any save re-encodes the content alongside it, which is the
            corruption this is guarding against. */}
        <AssetMetadataFields draft={draft} onChange={change} uriError={uriError} disabled={!editing || !editable} />

        {/* Proof a save or a create landed, since the page it lands on otherwise looks
            exactly as it did before. */}
        {!editing && landed !== null && (
          <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
            <AlertTitle>{landed.title}</AlertTitle>
            <AlertDescription className="text-green-800/90 dark:text-green-200/90">{landed.detail}</AlertDescription>
          </Alert>
        )}

        {editing && draft.type !== asset.type && (
          <Alert>
            <AlertTitle>Asset type changed to {draft.type}</AlertTitle>
            <AlertDescription>
              Changing the type does not change the content. This asset&apos;s content probably needs rewriting to match.
            </AlertDescription>
          </Alert>
        )}

        {!editable && (
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

        {editing && <ContentSizeAlert content={draft.content} />}
      </div>

      <div className="min-h-0 flex-1">
        {showDiff ? (
          <AssetDiffEditor original={stored.text} modified={draft.content} language={language} isTemplate={draft.isTemplate} />
        ) : (
          <AssetEditor
            value={draft.content}
            language={language}
            isTemplate={draft.isTemplate}
            readOnly={!editing || !editable}
            onChange={(content) => change({ content })}
            onSave={editing ? requestSave : undefined}
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
