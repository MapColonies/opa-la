import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { components } from 'auth-openapi';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AssetEditor } from '../../components/asset-editor';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { getFetchClient } from '../../fetch';
import { encodeAssetContent } from '../../lib/asset-content';
import { AssetMetadataFields } from './AssetMetadataFields';
import { type AssetDraft, type AssetUpsertBody } from './draft';
import { resolveEditorLanguage } from './language';
import { validateAssetName, validateUri } from './validation';

type Asset = components['schemas']['asset'];

const CONFLICT_STATUS = 409;

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

  const create = useMutation({
    mutationFn: async (body: AssetUpsertBody) => {
      const { data, error, response } = await getFetchClient().POST('/asset', { body: body as Asset });
      if (error !== undefined || data === undefined) {
        // A conflict here is a name already taken — a different failure, with a
        // different remedy, from the stale asset version a save on an existing asset hits.
        throw new Error(
          response.status === CONFLICT_STATUS
            ? `The name ${body.name} is already in use. Open that asset instead, or pick another name.`
            : (error?.message ?? 'The asset was not created.')
        );
      }
      return data;
    },
    onSuccess: (created) => {
      toast.success(`Created ${created.name}`);
      queryClient.invalidateQueries({ queryKey: ['get', '/asset'] });
      // Land in the editor for what was just created, so the work can continue.
      void navigate(`/assets/${encodeURIComponent(created.name)}`);
    },
  });

  const submit = () => {
    setAttempted(true);
    if (nameError !== null || uriError !== null || create.isPending) return;

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
    <div className="flex h-full flex-col gap-4">
      <div className="space-y-3">
        <Link to="/assets" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to assets
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">New asset</h1>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Create
          </Button>
        </div>

        <dl className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Asset version</dt>
            <dd className="font-medium">{FIRST_ASSET_VERSION}</dd>
          </div>
        </dl>

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
