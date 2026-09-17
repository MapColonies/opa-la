import { Loader2 } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { $api } from '../../fetch';
import { AssetDetail } from './AssetDetail';
import { AssetVersionView } from './AssetVersionView';

export const AssetPage = () => {
  const { assetName = '' } = useParams();
  const [searchParams] = useSearchParams();

  const { data, isLoading, isError, error, refetch } = $api.useQuery('get', '/asset/{assetName}', { params: { path: { assetName } } });

  // The endpoint answers with the asset version rows for this name, of unknown length.
  // Today the write path leaves exactly one, but nothing here assumes that.
  const versions = [...(data ?? [])].sort((left, right) => right.version - left.version);
  const latest = versions[0];

  // An unreadable or unknown version falls back to latest rather than to an error page.
  const requested = Number(searchParams.get('version'));
  const selected = versions.find((version) => version.version === requested) ?? latest;

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
  if (!latest || !selected) {
    return (
      <AssetPageMessage title={`No asset named ${assetName}`}>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/assets">Back to assets</Link>
        </Button>
      </AssetPageMessage>
    );
  }

  if (selected.version !== latest.version) {
    return <AssetVersionView asset={selected} latest={latest} versions={versions} />;
  }

  // Keyed so that moving to another asset starts a fresh draft rather than carrying one over.
  return <AssetDetail key={latest.name} asset={latest} versions={versions} />;
};

const AssetPageMessage = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex h-full items-center justify-center">
    <div className="text-center">
      <p className="font-medium">{title}</p>
      {children}
    </div>
  </div>
);
