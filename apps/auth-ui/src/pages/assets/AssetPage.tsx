import { Loader2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { $api } from '../../fetch';
import { AssetDetail } from './AssetDetail';
import { latestOf } from './versions';

export const AssetPage = () => {
  const { assetName = '' } = useParams();

  const { data, isLoading, isError, error, refetch } = $api.useQuery('get', '/asset/{assetName}', { params: { path: { assetName } } });

  // The endpoint answers with the asset version rows for this name, of unknown length.
  const asset = latestOf(data ?? []);

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

  // Keyed so that moving to another asset starts a fresh draft rather than carrying one over.
  return <AssetDetail key={asset.name} asset={asset} />;
};

const AssetPageMessage = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex h-full items-center justify-center">
    <div className="text-center">
      <p className="font-medium">{title}</p>
      {children}
    </div>
  </div>
);
