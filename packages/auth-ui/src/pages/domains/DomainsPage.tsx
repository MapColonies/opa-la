import { useState, useEffect, useRef } from 'react';
import { $api, siteApis } from '../../fetch';
import { Button } from '../../components/ui/button';
import { Loader2, Plus, Search, Filter, X, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Dialog } from '../../components/ui/dialog';
import { components } from '../../types/schema';
import { DomainsTable } from './DomainsTable';
import { CreateDomainModal } from './CreateDomainModal';
import { toast } from 'sonner';
import { useDebounce } from '../../hooks/useDebounce';
import { useQueryClient } from '@tanstack/react-query';
import { availableSites } from '../../components/SiteSelection';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

type Domain = components['schemas']['domain'];

type SiteResult = {
  site: string;
  success: boolean;
  error?: string;
};

type SortField = 'domain';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField;
  direction: SortDirection;
}

const updateURL = (params: Record<string, string | number | boolean | string[]>) => {
  const url = new URL(window.location.href);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      url.searchParams.delete(key);
    } else if (Array.isArray(value)) {
      url.searchParams.set(key, value.join(','));
    } else {
      url.searchParams.set(key, value.toString());
    }
  });

  window.history.replaceState({}, '', url.toString());
};

const getURLParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    page: parseInt(params.get('page') || '1', 10),
    pageSize: parseInt(params.get('pageSize') || '10', 10),
    search: params.get('search') || '',
    sort: params.get('sort')
      ? params
          .get('sort')!
          .split(',')
          .map((s) => {
            const [field, direction] = s.split(':');
            return { field: field as SortField, direction: (direction || 'asc') as SortDirection };
          })
      : [{ field: 'domain' as SortField, direction: 'asc' as SortDirection }],
    showAdvancedFilters: params.get('showFilters') === 'true',
  };
};

export const DomainsPage = () => {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [isOtherSitesPending, setIsOtherSitesPending] = useState(false);
  const [siteResults, setSiteResults] = useState<SiteResult[]>([]);
  const [currentCreateStep, setCurrentCreateStep] = useState<'create' | 'send'>('create');

  const urlParams = getURLParams();
  const [searchTerm, setSearchTerm] = useState(urlParams.search);
  const [page, setPage] = useState(urlParams.page);
  const [pageSize, setPageSize] = useState(urlParams.pageSize);
  const [sort, setSort] = useState<SortState[]>(urlParams.sort);

  const isInitialRender = useRef(true);

  const debouncedSearchTerm = useDebounce(searchTerm);

  useEffect(() => {
    const sortParams = sort.map((s) => `${s.field}:${s.direction}`);
    updateURL({
      page,
      pageSize,
      search: searchTerm,
      sort: sortParams,
    });
  }, [page, pageSize, searchTerm, sort]);

  const queryParams = {
    page,
    page_size: pageSize,
    sort: sort.map((s) => `${s.field}:${s.direction}`),
  };

  const { data, isLoading, isError, error, refetch } = $api.useQuery('get', '/domain', {
    params: {
      query: queryParams,
    },
  });

  useEffect(() => {
    if (!isInitialRender.current) {
      setPage(1);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    isInitialRender.current = false;
  }, []);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    return count;
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setPage(1);
  };

  const siteMutations = availableSites.reduce(
    (acc, site) => {
      const siteApi = siteApis?.[site];
      if (siteApi) {
        acc[site] = siteApi.useMutation('post', '/domain');
      }
      return acc;
    },
    {} as Record<string, any>
  );

  const createDomainMutation = $api.useMutation('post', '/domain', {
    onSuccess: () => {
      setCreateSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['get', '/domain'] });
    },
    onError: (error) => {
      console.error('Error creating domain:', error);
      setCreateError(error.message);
    },
  });

  useEffect(() => {
    if (!isCreateDialogOpen) {
      setCreateError(null);
      setCreateSuccess(false);
      setSiteResults([]);
      setCurrentCreateStep('create');
    }
  }, [isCreateDialogOpen]);

  const handleCreateDomain = (data: { body: Domain }) => {
    setCreateError(null);
    createDomainMutation.mutate(data);
  };

  const handleSort = (field: SortField) => {
    setSort((prevSort) => {
      const existingSort = prevSort.find((s) => s.field === field);
      if (existingSort) {
        if (existingSort.direction === 'asc') {
          return prevSort.map((s) => (s.field === field ? { ...s, direction: 'desc' as SortDirection } : s));
        } else {
          return prevSort.filter((s) => s.field !== field);
        }
      } else {
        return [{ field, direction: 'asc' as SortDirection }, ...prevSort];
      }
    });
    setPage(1);
  };

  const getSortDirection = (field: SortField): SortDirection | null => {
    const sortItem = sort.find((s) => s.field === field);
    return sortItem?.direction || null;
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize));
    setPage(1);
  };

  const handleSendToOtherSites = async (data: { body: Domain; sites: string[] }) => {
    if (!data.sites.length) return;

    setIsOtherSitesPending(true);
    setSiteResults([]);

    try {
      const results = await Promise.allSettled(
        data.sites.map(async (site) => {
          const mutation = siteMutations[site];
          if (!mutation) {
            return { site, success: false, error: 'Site API not available' };
          }

          try {
            await mutation.mutateAsync({
              body: data.body,
            });
            return { site, success: true };
          } catch (error) {
            console.error(`Error sending domain to site ${site}:`, error);
            const errorMessage =
              error instanceof Error
                ? error.message
                : typeof error === 'object' && error !== null && 'message' in error
                  ? String(error.message)
                  : JSON.stringify(error);
            return { site, success: false, error: errorMessage };
          }
        })
      );

      const siteResultsData: SiteResult[] = results.map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            site: 'unknown',
            success: false,
            error: result.reason?.message || 'Promise rejected',
          };
        }
      });

      setSiteResults(siteResultsData);

      const successfulSites = siteResultsData.filter((result) => result.success).map((result) => result.site);

      const failedSites = siteResultsData.filter((result) => !result.success).map((result) => result.site);

      if (successfulSites.length > 0) {
        toast.success(`Domain successfully sent to: ${successfulSites.join(', ')}`);
        queryClient.invalidateQueries({ queryKey: ['get', '/domain'] });
      }

      if (failedSites.length > 0) {
        toast.error(`Failed to send domain to: ${failedSites.join(', ')}`);
      }
    } catch (error) {
      console.error('Error in multi-site domain send:', error);
      toast.error('Error sending domain to other sites');
    } finally {
      setIsOtherSitesPending(false);
    }
  };

  const filteredData =
    data?.items?.filter((domain) => {
      if (!debouncedSearchTerm) return true;
      const searchLower = debouncedSearchTerm.toLowerCase();
      return domain.name?.toLowerCase().includes(searchLower);
    }) || [];

  const totalPages = data?.total ? Math.ceil(data.total / pageSize) : 0;
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, data?.total || 0);
  const hasActiveFilters = getActiveFiltersCount() > 0;

  if (isLoading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="text-destructive">
          <p className="font-medium">Failed to load domains</p>
          <p className="text-sm text-muted-foreground mt-1">{error?.message || 'Please try again later'}</p>
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
        <h1 className="text-2xl font-bold">Domains</h1>
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            if (!open && currentCreateStep === 'send') {
              return;
            }
            setIsCreateDialogOpen(open);
          }}
        >
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Domain
          </Button>
          {isCreateDialogOpen && (
            <CreateDomainModal
              onClose={() => setIsCreateDialogOpen(false)}
              onCreateDomain={handleCreateDomain}
              onSendToOtherSites={handleSendToOtherSites}
              isPending={createDomainMutation.isPending}
              isOtherSitesPending={isOtherSitesPending}
              error={createError}
              success={createSuccess}
              siteResults={siteResults}
              onOpenChange={setIsCreateDialogOpen}
              onStepChange={setCurrentCreateStep}
            />
          )}
        </Dialog>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by domain name..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1">
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchTerm}
                <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[400px] overflow-hidden border rounded-md">
        <DomainsTable domains={filteredData} onSort={handleSort} sortDirection={getSortDirection} />
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {startItem}-{endItem} of {data?.total || 0} results
          </p>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">per page</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            <p className="text-sm font-medium">
              Page {page} of {totalPages}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
