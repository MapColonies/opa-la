import type { components } from 'auth-openapi';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { $api } from '../../fetch';
import { BundleDetailsModal } from './BundleDetailsModal';
import { BundlesTable } from './BundlesTable';

type Bundle = components['schemas']['bundle'];
type Environment = components['schemas']['environment'];

const ENVIRONMENTS: Environment[] = ['np', 'stage', 'prod'];

/** Radix rejects an empty option value, so "no filter" needs a name of its own. */
const ANY = 'all';

const oneOf = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

// The date input hands back a bare YYYY-MM-DD with no timezone attached — the day the
// user pointed at in their own local time, not in UTC. `new Date(y, m, d, ...)` reads
// its numeric arguments as local time, so the boundary lands on the right side of
// midnight for that user; `.toISOString()` then converts it to the UTC instant the
// endpoint expects. Matches the local-day-picked, UTC-on-the-wire pattern ClientsPage
// already uses via its Calendar picker.
const dayBoundary = (date: string, end: boolean): string => {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return end ? new Date(year, month - 1, day, 23, 59, 59, 999).toISOString() : new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
};

const startOfDay = (date: string): string => dayBoundary(date, false);
const endOfDay = (date: string): string => dayBoundary(date, true);

// The endpoint has no sort parameter, so the newest-first order is applied here rather
// than relied upon from the response.
const byCreatedAtDesc = (a: Bundle, b: Bundle): number => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();

export const BundlesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);

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
    ...(createdAfter && { createdAfter: startOfDay(createdAfter) }),
    ...(createdBefore && { createdBefore: endOfDay(createdBefore) }),
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
          <BundlesTable bundles={[...(data ?? [])].sort(byCreatedAtDesc)} onSelectBundle={setSelectedBundle} />
        )}
      </div>

      <Dialog open={selectedBundle !== null} onOpenChange={(open) => !open && setSelectedBundle(null)}>
        {selectedBundle && <BundleDetailsModal bundle={selectedBundle} />}
      </Dialog>
    </div>
  );
};
