import type { components } from 'auth-openapi';
import { ArrowLeft, GitCompare } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AssetDiffEditor, AssetEditor } from '../../components/asset-editor';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { AssetVersionSelect } from './AssetVersionSelect';
import { decodeAssetContent } from '../../lib/asset-content';
import { resolveEditorLanguage } from './language';

type Asset = components['schemas']['asset'];

interface AssetVersionViewProps {
  /** The asset version being read, which is not the latest. */
  asset: Asset;
  latest: Asset;
  versions: Asset[];
}

/**
 * An older asset version, read-only. There is no way to save from here: posting this
 * content back would declare a stale asset version, and overwriting latest with an
 * older body is exactly the mistake this page exists to prevent.
 */
export const AssetVersionView = ({ asset, latest, versions }: AssetVersionViewProps) => {
  const [showComparison, setShowComparison] = useState(false);

  const content = useMemo(() => decodeAssetContent(asset.value), [asset.value]);
  const latestContent = useMemo(() => decodeAssetContent(latest.value), [latest.value]);
  const language = resolveEditorLanguage(asset.type, asset.name);

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
            <Badge variant="outline">{asset.type}</Badge>
            {asset.isTemplate && <Badge variant="secondary">Template</Badge>}
          </div>

          <div className="flex items-end gap-2">
            <AssetVersionSelect versions={versions} selectedVersion={asset.version} />
            <Button variant="outline" onClick={() => setShowComparison((shown) => !shown)}>
              <GitCompare className="mr-2 h-4 w-4" />
              {showComparison ? 'Back to content' : 'Compare with latest'}
            </Button>
          </div>
        </div>

        <Alert>
          <AlertTitle>Asset version {asset.version} is not the latest</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>Latest is asset version {latest.version}. This one is read-only, so it cannot be saved over what is deployed.</span>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/assets/${encodeURIComponent(asset.name)}`}>Go to latest</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>

      <div className="min-h-0 flex-1">
        {showComparison ? (
          <AssetDiffEditor original={content.text} modified={latestContent.text} language={language} isTemplate={asset.isTemplate} />
        ) : (
          <AssetEditor value={content.text} language={language} isTemplate={asset.isTemplate} readOnly />
        )}
      </div>
    </div>
  );
};
