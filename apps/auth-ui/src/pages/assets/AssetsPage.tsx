import type { components } from 'auth-openapi';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { $api } from '../../fetch';
import { useDebounce } from '../../hooks/useDebounce';
import { AssetsTable } from './AssetsTable';
import { nextSort, parseSort, sortAssets, type AssetSortField } from './sorting';

type AssetType = components['schemas']['assetType'];
type Environment = components['schemas']['environment'];

const ENVIRONMENTS: Environment[] = ['np', 'stage', 'prod'];
const ASSET_TYPES: AssetType[] = ['POLICY', 'TEST', 'DATA', 'TEST_DATA'];
const PAGE_SIZES = ['10', '20', '50', '100'];

/** Radix rejects an empty option value, so "no filter" needs a name of its own. */
const ANY = 'all';

export const AssetsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const environment = searchParams.get('environment') ?? ANY;
  const type = searchParams.get('type') ?? ANY;
  const template = searchParams.get('template') ?? ANY;
  const sort = parseSort(searchParams.get('sort'));
  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? '10');

  const [searchTerm, setSearchTerm] = useState(searchParams.get('name') ?? '');
  const debouncedSearchTerm = useDebounce(searchTerm);

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

  // The typed term drives the filter immediately; the url follows once typing settles.
  useEffect(() => {
    if (debouncedSearchTerm === (searchParams.get('name') ?? '')) return;
    updateParams({ name: debouncedSearchTerm, page: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]);

  // Only the three filters the collection endpoint understands travel to the server.
  const query = {
    ...(environment === ANY ? {} : { environment: [environment as Environment] }),
    ...(type === ANY ? {} : { type: type as AssetType }),
    ...(template === ANY ? {} : { isTemplate: template === 'true' }),
  };

  const { data, isLoading, isError, error, refetch } = $api.useQuery('get', '/asset', { params: { query } });

  // Searching and sorting run here, not on the server: the collection endpoint offers neither.
  const searchTermLower = debouncedSearchTerm.trim().toLowerCase();
  const found = searchTermLower ? (data ?? []).filter((asset) => asset.name.toLowerCase().includes(searchTermLower)) : (data ?? []);
  const matching = sortAssets(found, sort);

  const totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const visible = matching.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeFilters = [environment, type, template].filter((value) => value !== ANY).length + (searchTerm ? 1 : 0);

  if (isLoading) {
    return (
      <div className="flex h-[450px] items-center justify-center" role="status" aria-label="Loading assets">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="text-destructive">
          <p className="font-medium">Failed to load assets</p>
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
        <h1 className="text-2xl font-bold">Assets</h1>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Search by asset name"
              placeholder="Search by asset name..."
              className="pl-8"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <Select value={environment} onValueChange={(value) => updateParams({ environment: value, page: null })}>
            <SelectTrigger className="w-[170px]" aria-label="Environment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All environments</SelectItem>
              {ENVIRONMENTS.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={type} onValueChange={(value) => updateParams({ type: value, page: null })}>
            <SelectTrigger className="w-[150px]" aria-label="Asset type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All types</SelectItem>
              {ASSET_TYPES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={template} onValueChange={(value) => updateParams({ template: value, page: null })}>
            <SelectTrigger className="w-[170px]" aria-label="Template">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Templates and not</SelectItem>
              <SelectItem value="true">Templates only</SelectItem>
              <SelectItem value="false">Non-templates only</SelectItem>
            </SelectContent>
          </Select>

          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => {
                setSearchTerm('');
                updateParams({ environment: null, type: null, template: null, name: null, page: null });
              }}
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>

        {searchTerm && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              Search: {searchTerm}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[400px] overflow-hidden border rounded-md">
        <AssetsTable
          assets={visible}
          onSort={(field: AssetSortField) => {
            const next = nextSort(sort, field);
            updateParams({ sort: next ? `${next.field}:${next.direction}` : null, page: null });
          }}
          sortDirection={(field) => (sort?.field === field ? sort.direction : null)}
        />
      </div>

      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {matching.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, matching.length)} of{' '}
            {matching.length} results
          </p>
          <Select value={String(pageSize)} onValueChange={(value) => updateParams({ pageSize: value, page: null })}>
            <SelectTrigger className="w-[70px]" aria-label="Page size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">per page</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" aria-label="First page" onClick={() => updateParams({ page: '1' })} disabled={currentPage === 1}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Previous page"
            onClick={() => updateParams({ page: String(currentPage - 1) })}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </p>
          <Button
            variant="outline"
            size="sm"
            aria-label="Next page"
            onClick={() => updateParams({ page: String(currentPage + 1) })}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Last page"
            onClick={() => updateParams({ page: String(totalPages) })}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
