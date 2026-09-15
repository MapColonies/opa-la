import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AssetEditor } from '../../components/asset-editor';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { encodeAssetContent, isOverSizeLimit } from '../../lib/asset-content';
import { AssetMetadataFields } from './AssetMetadataFields';
import { ContentSizeAlert } from './ContentSizeAlert';
import { sameDraft, type AssetDraft, type AssetUpsertBody } from './draft';
import { resolveEditorLanguage } from './language';
import { CONFLICT_STATUS, SaveFailure, saveAsset } from './save';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { validateAssetName, validateUri } from './validation';

/** The api requires 1 for an asset that does not yet exist. */
const FIRST_ASSET_VERSION = 1;

/** Everything an author should not have to fill in for a new asset. */
const DEFAULT_DRAFT: AssetDraft = { content: '', type: 'POLICY', uri: '/', environment: [], isTemplate: false };

export const CreateAssetPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [draft, setDraft] = useState<AssetDraft>(DEFAULT_DRAFT);
  const [attempted, setAttempted] = useState(false);

  const change = (changes: Partial<AssetDraft>) => setDraft((current) => ({ ...current, ...changes }));

  const nameError = validateAssetName(name);
  const uriError = validateUri(draft.uri);
  const overSizeLimit = isOverSizeLimit(draft.content);

  // Nothing is kept as a draft here either, and a whole freshly typed policy is easier to
  // lose from this page than from an existing asset's.
  const started = name !== '' || !sameDraft(draft, DEFAULT_DRAFT);

  const create = useMutation({
    mutationFn: async (body: AssetUpsertBody) => {
      try {
        return await saveAsset(body);
      } catch (failure) {
        // A conflict here is a name already taken — a different failure, with a different
        // remedy, from the stale asset version a save on an existing asset hits.
        if (failure instanceof SaveFailure && failure.status === CONFLICT_STATUS) {
          throw new Error(`The name ${body.name} is already in use. Open that asset instead, or pick another name.`);
        }
        throw failure;
      }
    },
    onSuccess: (created) => {
      toast.success(`Created ${created.name}`);
      queryClient.invalidateQueries({ queryKey: ['get', '/asset'] });
    },
  });

  // Land in the editor for what was just created, so the work can continue. In an effect
  // rather than in onSuccess so the unsaved-work guard has already seen the save land.
  //
  // The asset page it lands on looks the same whether it was just created or opened from
  // the list, so what happened travels with the navigation and is said there.
  const created = create.data;
  useEffect(() => {
    if (created !== undefined) {
      void navigate(`/assets/${encodeURIComponent(created.name)}`, { state: { createdVersion: created.version } });
    }
  }, [created, navigate]);

  const submit = () => {
    setAttempted(true);
    if (nameError !== null || uriError !== null || overSizeLimit || create.isPending) return;

    create.mutate({
      name: name.trim(),
      version: FIRST_ASSET_VERSION,
      value: encodeAssetContent(draft.content),
      uri: draft.uri,
      type: draft.type,
      isTemplate: draft.isTemplate,
      environment: draft.environment,
    });
  };

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <UnsavedChangesDialog when={started && !create.isSuccess} />

      <div className="space-y-3">
        <Link to="/assets" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to assets
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">New asset</h1>
            {/* An asset's version is assigned by the api, not chosen here. Saying which one
                this will be belongs beside the title, not in a field that looks fillable. */}
            <Badge variant="outline">Will be saved as asset version {FIRST_ASSET_VERSION}</Badge>
          </div>
          <Button onClick={submit} disabled={create.isPending || overSizeLimit}>
            {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Create
          </Button>
        </div>

        <div className="space-y-1">
          <Label htmlFor="asset-name">Name</Label>
          <Input
            id="asset-name"
            className="w-[280px]"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={attempted && nameError !== null}
          />
          {attempted && nameError !== null && <p className="text-sm text-destructive">{nameError}</p>}
        </div>

        <AssetMetadataFields draft={draft} onChange={change} uriError={uriError} />

        <ContentSizeAlert content={draft.content} />

        {create.isError && (
          <Alert variant="destructive">
            <AlertTitle>Could not create the asset</AlertTitle>
            <AlertDescription>{create.error.message}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="min-h-0 flex-1">
        <AssetEditor
          value={draft.content}
          language={resolveEditorLanguage(draft.type, name)}
          isTemplate={draft.isTemplate}
          onChange={(content) => change({ content })}
          onSave={submit}
        />
      </div>
    </div>
  );
};
