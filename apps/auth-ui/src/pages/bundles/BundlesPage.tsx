import { Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { $api } from '../../fetch';
import { BundlesTable } from './BundlesTable';

export const BundlesPage = () => {
  const { data, isLoading, isError, error, refetch } = $api.useQuery('get', '/bundle');

  if (isError) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="text-destructive">
          <p className="font-medium">Failed to load bundles</p>
          <p className="text-sm text-muted-foreground mt-1">{error?.message ?? 'Please try again later'}</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bundles</h1>
      </div>

      <div className="flex-1 min-h-[400px] overflow-hidden border rounded-md">
        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center" role="status" aria-label="Loading bundles">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <BundlesTable bundles={data ?? []} />
        )}
      </div>
    </div>
  );
};
