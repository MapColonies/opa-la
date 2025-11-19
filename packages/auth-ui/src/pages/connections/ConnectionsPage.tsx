import { useState, useEffect, useRef } from 'react';
import { $api, siteApis } from '../../fetch';
import { Button } from '../../components/ui/button';
import { Loader2, Plus, Filter, X, Search, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Dialog } from '../../components/ui/dialog';
import { components } from '../../types/schema';
import { ConnectionsTable } from './ConnectionsTable';
import { CreateConnectionModal } from './CreateConnectionModal';
import { EditConnectionModal } from './EditConnectionModal';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '../../components/ui/badge';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../lib/utils';
import { getAvailableSites } from '@/components/exports';

type Connection = components['schemas']['connection'];
type Environment = components['schemas']['environment'];

type SiteResult = {
  site: string;
  success: boolean;
  error?: string;
};

interface Filters {
  environment?: Environment[];
  isEnabled?: boolean;
  isNoBrowser?: boolean;
  isNoOrigin?: boolean;
  domains?: string[];
}

type SortField = 'created-at' | 'name' | 'version' | 'enabled' | 'environment';
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
  const storedLatestOnly = localStorage.getItem('connectionsLatestOnly');
  return {
    page: parseInt(params.get('page') || '1', 10),
    pageSize: parseInt(params.get('pageSize') || '10', 10),
    environment: params.get('environment') || 'all',
    isEnabled: params.get('isEnabled') ? params.get('isEnabled') === 'true' : undefined,
    isNoBrowser: params.get('isNoBrowser') ? params.get('isNoBrowser') === 'true' : undefined,
    isNoOrigin: params.get('isNoOrigin') ? params.get('isNoOrigin') === 'true' : undefined,
    searchTerm: params.get('name') || '',
    latestOnly: params.get('onlyLatest') ? params.get('onlyLatest') === 'true' : storedLatestOnly !== null ? storedLatestOnly === 'true' : true,
    sort: params.get('sort')
      ? params
          .get('sort')!
          .split(',')
          .map((s) => {
            const [field, direction] = s.split(':');
            return { field: field as SortField, direction: (direction || 'asc') as SortDirection };
          })
      : [
          { field: 'name' as SortField, direction: 'asc' as SortDirection },
          { field: 'environment' as SortField, direction: 'asc' as SortDirection },
          { field: 'version' as SortField, direction: 'desc' as SortDirection },
        ],
    showAdvancedFilters: params.get('showFilters') === 'true',
  };
};

const availableSites = getAvailableSites();

export const ConnectionsPage = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Filters>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [isOtherSitesPending, setIsOtherSitesPending] = useState(false);
  const [siteResults, setSiteResults] = useState<SiteResult[]>([]);
  const [currentCreateStep, setCurrentCreateStep] = useState<'create' | 'send'>('create');

  const urlParams = getURLParams();
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | 'all'>(urlParams.environment as Environment | 'all');
  const [isEnabled, setIsEnabled] = useState<boolean | undefined>(urlParams.isEnabled);
  const [isNoBrowser, setIsNoBrowser] = useState<boolean | undefined>(urlParams.isNoBrowser);
  const [isNoOrigin, setIsNoOrigin] = useState<boolean | undefined>(urlParams.isNoOrigin);
  const [latestOnly, setLatestOnly] = useState<boolean>(urlParams.latestOnly);
  const [searchTerm, setSearchTerm] = useState(urlParams.searchTerm);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(urlParams.showAdvancedFilters);
  const [page, setPage] = useState(urlParams.page);
  const [pageSize, setPageSize] = useState(urlParams.pageSize);
  const [sort, setSort] = useState<SortState[]>(urlParams.sort);

  const isInitialRender = useRef(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const wasLoading = useRef(false);

  const debouncedSearchTerm = useDebounce(searchTerm);

  useEffect(() => {
    const sortParams = sort.map((s) => `${s.field}:${s.direction}`);
    updateURL({
      page,
      pageSize,
      environment: selectedEnvironment === 'all' ? '' : selectedEnvironment,
      isEnabled: isEnabled !== undefined ? isEnabled : '',
      isNoBrowser: isNoBrowser !== undefined ? isNoBrowser : '',
      isNoOrigin: isNoOrigin !== undefined ? isNoOrigin : '',
      search: searchTerm,
      latestOnly,
      sort: sortParams,
      showFilters: showAdvancedFilters,
    });
  }, [page, pageSize, selectedEnvironment, isEnabled, isNoBrowser, isNoOrigin, searchTerm, latestOnly, sort, showAdvancedFilters]);

  useEffect(() => {
    localStorage.setItem('connectionsLatestOnly', latestOnly.toString());
  }, [latestOnly]);

  const queryParams = {
    ...filters,
    page,
    page_size: pageSize,
    sort: sort.map((s) => `${s.field}:${s.direction}`),
    ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
    ...(latestOnly && { latestOnly }),
  };

  const { data, isLoading, isError, error, refetch } = $api.useQuery('get', '/connection', {
    params: {
      query: queryParams,
    },
  });

  const siteMutations = availableSites.reduce(
    (acc, site) => {
      const siteApi = siteApis?.[site];
      if (siteApi) {
        acc[site] = siteApi.useMutation('post', '/connection');
      }
      return acc;
    },
    {} as Record<string, any>
  );

  const upsertConnectionMutation = $api.useMutation('post', '/connection', {
    onSuccess: () => {
      setCreateSuccess(true);
      setEditSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['get', '/connection'] });
    },
    onError: (error) => {
      console.error('Error saving connection:', error);
      setCreateError(error.message);
      setEditError(error.message);
    },
  });

  useEffect(() => {
    if (!isCreateDialogOpen) {
      setCreateError(null);
      setCreateSuccess(false);
      setSiteResults([]);
      setCurrentCreateStep('create');
    }
    if (!isEditDialogOpen) {
      setEditError(null);
      setEditSuccess(false);
      setSelectedConnection(null);
      setSiteResults([]);
    }
  }, [isCreateDialogOpen, isEditDialogOpen]);

  useEffect(() => {
    const newFilters: Filters = {};

    if (selectedEnvironment !== 'all') {
      newFilters.environment = [selectedEnvironment];
    }

    if (isEnabled !== undefined) {
      newFilters.isEnabled = isEnabled;
    }

    if (isNoBrowser !== undefined) {
      newFilters.isNoBrowser = isNoBrowser;
    }

    if (isNoOrigin !== undefined) {
      newFilters.isNoOrigin = isNoOrigin;
    }

    setFilters(newFilters);

    if (!isInitialRender.current) {
      setPage(1);
    }
  }, [selectedEnvironment, isEnabled, isNoBrowser, isNoOrigin]);

  useEffect(() => {
    if (!isInitialRender.current) {
      setPage(1);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    isInitialRender.current = false;
  }, []);

  useEffect(() => {
    if (wasLoading.current && !isLoading && searchInputRef.current) {
      searchInputRef.current.focus();
      const length = searchInputRef.current.value.length;
      searchInputRef.current.setSelectionRange(length, length);
    }
    wasLoading.current = isLoading;
  }, [isLoading]);

  const handleCreateConnection = (data: { body: Connection }) => {
    setCreateError(null);
    upsertConnectionMutation.mutate(data);
  };

  const handleUpdateConnection = (data: { body: Connection }) => {
    setEditError(null);
    upsertConnectionMutation.mutate(data);
  };

  const handleSendToOtherSites = async (data: { body: Connection; sites: string[] }) => {
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
            console.error(`Error sending connection to site ${site}:`, error);
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
        toast.success(`Connection successfully sent to: ${successfulSites.join(', ')}`);
        queryClient.invalidateQueries({ queryKey: ['get', '/connection'] });
      }

      if (failedSites.length > 0) {
        toast.error(`Failed to send connection to: ${failedSites.join(', ')}`);
      }
    } catch (error) {
      console.error('Error in multi-site connection send:', error);
      toast.error('Error sending connection to other sites');
    } finally {
      setIsOtherSitesPending(false);
    }
  };

  const openEditDialog = (connection: Connection) => {
    setSelectedConnection({ ...connection });
    setIsEditDialogOpen(true);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedEnvironment !== 'all') count++;
    if (isEnabled !== undefined) count++;
    if (isNoBrowser !== undefined) count++;
    if (isNoOrigin !== undefined) count++;
    return count;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  const clearAllFilters = () => {
    setSelectedEnvironment('all');
    setIsEnabled(undefined);
    setIsNoBrowser(undefined);
    setIsNoOrigin(undefined);
    setSearchTerm('');
    setPage(1);
  };

  const removeFilter = (filterType: string) => {
    switch (filterType) {
      case 'search':
        setSearchTerm('');
        break;
      case 'environment':
        setSelectedEnvironment('all');
        break;
      case 'enabled':
        setIsEnabled(undefined);
        break;
      case 'noBrowser':
        setIsNoBrowser(undefined);
        break;
      case 'noOrigin':
        setIsNoOrigin(undefined);
        break;
    }
    setPage(1);
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

  const filteredData = data?.items || [];

  const totalPages = data?.total ? Math.ceil(data.total / pageSize) : 0;
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, data?.total || 0);

  if (isError) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="text-destructive">
          <p className="font-medium">Failed to load connections</p>
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
        <h1 className="text-2xl font-bold">Connections</h1>
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
            Add Connection
          </Button>
          {isCreateDialogOpen && (
            <CreateConnectionModal
              onClose={() => setIsCreateDialogOpen(false)}
              onCreateConnection={handleCreateConnection}
              onSendToOtherSites={handleSendToOtherSites}
              isPending={upsertConnectionMutation.isPending}
              isOtherSitesPending={isOtherSitesPending}
              error={createError}
              success={createSuccess}
              siteResults={siteResults}
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
              ref={searchInputRef}
              type="search"
              placeholder="Search connections..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-background">
              <Label htmlFor="latest-only" className="text-sm font-medium cursor-pointer whitespace-nowrap">
                Latest Only
              </Label>
              <Switch
                id="latest-only"
                checked={latestOnly}
                onCheckedChange={(checked: boolean) => {
                  setLatestOnly(checked);
                  setPage(1);
                }}
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={cn('gap-2', hasActiveFilters && 'border-primary text-primary')}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {getActiveFiltersCount()}
                </Badge>
              )}
              <ChevronDown className={cn('h-4 w-4 transition-transform', showAdvancedFilters && 'rotate-180')} />
            </Button>

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
                Name: {searchTerm}
                <button onClick={() => removeFilter('search')} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedEnvironment !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Environment: {selectedEnvironment}
                <button onClick={() => removeFilter('environment')} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {isEnabled !== undefined && (
              <Badge variant="secondary" className="gap-1">
                Enabled: {isEnabled ? 'Yes' : 'No'}
                <button onClick={() => removeFilter('enabled')} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {isNoBrowser !== undefined && (
              <Badge variant="secondary" className="gap-1">
                No Browser: {isNoBrowser ? 'Yes' : 'No'}
                <button onClick={() => removeFilter('noBrowser')} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {isNoOrigin !== undefined && (
              <Badge variant="secondary" className="gap-1">
                No Origin: {isNoOrigin ? 'Yes' : 'No'}
                <button onClick={() => removeFilter('noOrigin')} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {showAdvancedFilters && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Advanced Filters
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Environment</Label>
                <Select value={selectedEnvironment} onValueChange={(value) => setSelectedEnvironment(value as Environment | 'all')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Environments</SelectItem>
                    <SelectItem value="np">Non-Production</SelectItem>
                    <SelectItem value="stage">Stage</SelectItem>
                    <SelectItem value="prod">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Status Filters</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isEnabled"
                      checked={isEnabled === true}
                      onCheckedChange={(checked: boolean | 'indeterminate') => setIsEnabled(checked === true ? true : undefined)}
                    />
                    <Label htmlFor="isEnabled" className="text-sm">
                      Enabled
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isNoBrowser"
                      checked={isNoBrowser === true}
                      onCheckedChange={(checked: boolean | 'indeterminate') => setIsNoBrowser(checked === true ? true : undefined)}
                    />
                    <Label htmlFor="isNoBrowser" className="text-sm">
                      No Browser
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isNoOrigin"
                      checked={isNoOrigin === true}
                      onCheckedChange={(checked: boolean | 'indeterminate') => setIsNoOrigin(checked === true ? true : undefined)}
                    />
                    <Label htmlFor="isNoOrigin" className="text-sm">
                      No Origin
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[400px] overflow-hidden border rounded-md">
        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ConnectionsTable connections={filteredData} onEditConnection={openEditDialog} onSort={handleSort} sortDirection={getSortDirection} />
        )}
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        {isEditDialogOpen && (
          <EditConnectionModal
            connection={selectedConnection}
            onClose={() => setIsEditDialogOpen(false)}
            onUpdateConnection={handleUpdateConnection}
            onSendToOtherSites={handleSendToOtherSites}
            isPending={upsertConnectionMutation.isPending}
            isOtherSitesPending={isOtherSitesPending}
            error={editError}
            success={editSuccess}
            siteResults={siteResults}
            onOpenChange={setIsEditDialogOpen}
          />
        )}
      </Dialog>
    </div>
  );
};
