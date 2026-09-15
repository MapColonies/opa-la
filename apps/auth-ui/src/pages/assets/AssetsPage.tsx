import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Loader2, Plus, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { $api } from '../../fetch';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../lib/utils';
import { AssetsTable } from './AssetsTable';
import { ASSET_TYPES, ENVIRONMENTS } from './draft';
import { nextSort, parseSort, sortAssets, type AssetSortField } from './sorting';

const PAGE_SIZES = ['10', '20', '50', '100'];

/** Radix rejects an empty option value, so "no filter" needs a name of its own. */
const ANY = 'all';

const TEMPLATE_LABELS: Record<string, string> = { true: 'Templates only', false: 'Non-templates only' };

const positiveInteger = (value: string | null, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const oneOf = <T extends string>(value: string | null, allowed: readonly T[]): T | typeof ANY => (allowed.includes(value as T) ? (value as T) : ANY);

export const AssetsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // The url is external input: an unknown value would otherwise travel to the server as a filter and come back a 400.
  const environment = oneOf(searchParams.get('environment'), ENVIRONMENTS);
  const type = oneOf(searchParams.get('type'), ASSET_TYPES);
  const template = oneOf(searchParams.get('template'), ['true', 'false']);
  const sort = parseSort(searchParams.get('sort'));
  const page = positiveInteger(searchParams.get('page'), 1);
  const pageSize = positiveInteger(searchParams.get('pageSize'), 10);
  const showFilters = searchParams.get('showFilters') === 'true';

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

  // The url follows the typed term once typing settles, so a view stays shareable without
  // a history entry, or a request, per keystroke.
  useEffect(() => {
    if (debouncedSearchTerm === (searchParams.get('name') ?? '')) return;
    updateParams({ name: debouncedSearchTerm, page: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]);

  // Only the three filters the collection endpoint understands travel to the server.
  const query = {
    ...(environment === ANY ? {} : { environment: [environment] }),
    ...(type === ANY ? {} : { type }),
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
  const hasActiveFilters = activeFilters > 0;

  const clearAllFilters = () => {
    setSearchTerm('');
    updateParams({ environment: null, type: null, template: null, name: null, page: null });
  };

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
        <Button asChild>
          <Link to="/assets/new">
            <Plus className="mr-2 h-4 w-4" />
            Add asset
          </Link>
        </Button>
      </div>

      {/* The same shape as the other entity pages: a search box, a filter toggle carrying a
          count, the filters themselves in a panel underneath, and the active ones as
          removable badges. Every part of it is always mounted, so turning a filter on
          changes what the table holds and nothing about where the controls sit. */}
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

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => updateParams({ showFilters: showFilters ? null : 'true' })}
              className={cn('gap-2', hasActiveFilters && 'border-primary text-primary')}
            >
              <Filter className="h-4 w-4" />
              Filters
              <Badge
                variant="secondary"
                aria-hidden={!hasActiveFilters}
                aria-label={`${activeFilters} active ${activeFilters === 1 ? 'filter' : 'filters'}`}
                className={cn('ml-1 h-5 w-5 rounded-full p-0 text-xs', !hasActiveFilters && 'invisible')}
              >
                {activeFilters}
              </Badge>
              <ChevronDown className={cn('h-4 w-4 transition-transform', showFilters && 'rotate-180')} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn('gap-1', !hasActiveFilters && 'invisible')}
              disabled={!hasActiveFilters}
              onClick={clearAllFilters}
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          </div>
        </div>

        <div className="flex min-h-6 flex-wrap items-center gap-2">
          {searchTerm && <FilterBadge label="Name" value={searchTerm} onRemove={() => setSearchTerm('')} />}
          {environment !== ANY && (
            <FilterBadge label="Environment" value={environment} onRemove={() => updateParams({ environment: null, page: null })} />
          )}
          {type !== ANY && <FilterBadge label="Type" value={type} onRemove={() => updateParams({ type: null, page: null })} />}
          {template !== ANY && (
            <FilterBadge
              label="Template"
              value={TEMPLATE_LABELS[template] ?? template}
              onRemove={() => updateParams({ template: null, page: null })}
            />
          )}
        </div>

        {showFilters && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Advanced Filters
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Environment</Label>
                <Select value={environment} onValueChange={(value) => updateParams({ environment: value, page: null })}>
                  <SelectTrigger aria-label="Environment">
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
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Asset type</Label>
                <Select value={type} onValueChange={(value) => updateParams({ type: value, page: null })}>
                  <SelectTrigger aria-label="Asset type">
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
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Template</Label>
                <Select value={template} onValueChange={(value) => updateParams({ template: value, page: null })}>
                  <SelectTrigger aria-label="Template">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Templates and regular assets</SelectItem>
                    <SelectItem value="true">Templates only</SelectItem>
                    <SelectItem value="false">Non-templates only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* The spinner goes inside the table rather than in place of the page. Choosing a
          filter starts a fresh query, and a full-page spinner would unmount the controls
          the moment they were used. */}
      <div className="flex-1 min-h-[400px] overflow-hidden border rounded-md">
        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center" role="status" aria-label="Loading assets">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <AssetsTable
            assets={visible}
            onSort={(field: AssetSortField) => {
              const next = nextSort(sort, field);
              updateParams({ sort: next ? `${next.field}:${next.direction}` : null, page: null });
            }}
            sortDirection={(field) => (sort?.field === field ? sort.direction : null)}
          />
        )}
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

const FilterBadge = ({ label, value, onRemove }: { label: string; value: string; onRemove: () => void }) => (
  <Badge variant="secondary" className="gap-1">
    {label}: {value}
    <button onClick={onRemove} aria-label={`Remove the ${label.toLowerCase()} filter`} className="ml-1 hover:text-destructive">
      <X className="h-3 w-3" />
    </button>
  </Badge>
);
