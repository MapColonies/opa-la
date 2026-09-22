import type { components } from 'auth-openapi';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { $api } from '../../fetch';
import { BundlesTable } from './BundlesTable';

type Environment = components['schemas']['environment'];

const ENVIRONMENTS: Environment[] = ['np', 'stage', 'prod'];

/** Radix rejects an empty option value, so "no filter" needs a name of its own. */
const ANY = 'all';

const oneOf = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

export const BundlesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // The url is external input: an unknown value would otherwise travel to the server as a filter and come back a 400.
  const environment = oneOf(searchParams.get('environment'), ENVIRONMENTS, ANY);
  const createdAfter = searchParams.get('createdAfter') ?? '';
  const createdBefore = searchParams.get('createdBefore') ?? '';

  const updateParams = (changes: Record<string, string | null>) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value === null || value === '' || value === ANY) next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true }
    );
  };

  const query = {
    ...(environment === ANY ? {} : { environment: [environment] }),
    ...(createdAfter && { createdAfter }),
    ...(createdBefore && { createdBefore }),
  };

  const { data, isLoading, isError, error, refetch } = $api.useQuery('get', '/bundle', { params: { query } });

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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Environment</Label>
          <Select value={environment} onValueChange={(value) => updateParams({ environment: value })}>
            <SelectTrigger aria-label="Environment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All</SelectItem>
              {ENVIRONMENTS.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="created-after" className="text-sm font-medium">
            Created after
          </Label>
          <Input
            id="created-after"
            type="date"
            value={createdAfter}
            onChange={(event) => updateParams({ createdAfter: event.target.value || null })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="created-before" className="text-sm font-medium">
            Created before
          </Label>
          <Input
            id="created-before"
            type="date"
            value={createdBefore}
            onChange={(event) => updateParams({ createdBefore: event.target.value || null })}
          />
        </div>
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
