import { ArrowLeft, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AssetEditor } from '../../components/asset-editor';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { $api } from '../../fetch';
import { decodeAssetContent } from '../../lib/asset-content';
import { resolveEditorLanguage } from './language';
import { latestOf } from './versions';

export const AssetPage = () => {
  const { assetName = '' } = useParams();

  const { data, isLoading, isError, error, refetch } = $api.useQuery('get', '/asset/{assetName}', { params: { path: { assetName } } });

  // The endpoint answers with the asset version rows for this name, of unknown length.
  const asset = latestOf(data ?? []);
  const content = useMemo(() => decodeAssetContent(asset?.value ?? ''), [asset?.value]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center" role="status" aria-label="Loading asset">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <AssetPageMessage title="Failed to load asset">
        <p className="text-sm text-muted-foreground">{error?.message ?? 'Please try again later'}</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </AssetPageMessage>
    );
  }

  // An unknown name comes back as an empty list rather than a 404.
  if (!asset) {
    return (
      <AssetPageMessage title={`No asset named ${assetName}`}>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/assets">Back to assets</Link>
        </Button>
      </AssetPageMessage>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="space-y-3">
        <Link to="/assets" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to assets
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{asset.name}</h1>
          <Badge variant="outline">{asset.type}</Badge>
          {asset.isTemplate && <Badge variant="secondary">Template</Badge>}
        </div>

        {/* Name, asset version and creation time are shown, never edited: the name is half
            the asset's identity and there is no delete to undo an accidental second asset. */}
        <dl className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
          <Fact label="Asset version" value={String(asset.version)} />
          <Fact label="Created" value={formatCreatedAt(asset.createdAt)} />
          <Fact label="URI" value={asset.uri} />
          <Fact label="Environments" value={asset.environment.length === 0 ? 'none — reaches no bundle' : asset.environment.join(', ')} />
        </dl>
      </div>

      {!content.isValidText && (
        <Alert variant="destructive">
          <AlertTitle>Opened read-only</AlertTitle>
          <AlertDescription>
            This asset&apos;s content is not valid text. Saving it back would replace the original bytes with a mangled copy, and there is no way to
            restore it.
          </AlertDescription>
        </Alert>
      )}

      <div className="min-h-0 flex-1">
        <AssetEditor value={content.text} language={resolveEditorLanguage(asset.type, asset.name)} isTemplate={asset.isTemplate} readOnly />
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

const AssetPageMessage = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex h-full items-center justify-center">
    <div className="text-center">
      <p className="font-medium">{title}</p>
      {children}
    </div>
  </div>
);

const formatCreatedAt = (createdAt: string): string => {
  const parsed = new Date(createdAt);
  return Number.isNaN(parsed.getTime()) ? createdAt : parsed.toLocaleString();
};
