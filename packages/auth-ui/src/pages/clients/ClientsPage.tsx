import { $api, siteApis } from '../../fetch';
import { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Loader2, Plus, Search, Calendar, Filter, X, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Dialog } from '../../components/ui/dialog';
import { components } from '../../types/schema';
import { ClientsTable } from './ClientsTable';
import { CreateClientModal } from './CreateClientModal';
import { EditClientModal } from './EditClientModal';
import { toast } from 'sonner';
import { useDebounce } from '../../hooks/useDebounce';
import { Label } from '../../components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Calendar as CalendarComponent } from '../../components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { availableSites } from '../../components/SiteSelection';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

type Client = components['schemas']['client'];
type NamelessClient = components['schemas']['namelessClient'];

type SiteResult = {
  site: string;
  success: boolean;
  error?: string;
};

type Filters = {
  branch?: string;
  createdBefore?: string;
  createdAfter?: string;
  updatedBefore?: string;
  updatedAfter?: string;
  tags?: string[];
};

type SortField = 'created-at' | 'updated-at' | 'name' | 'heb-name' | 'branch';
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
    branch: params.get('branch') || '',
    createdAfter: params.get('createdAfter') || '',
    createdBefore: params.get('createdBefore') || '',
    updatedAfter: params.get('updatedAfter') || '',
    updatedBefore: params.get('updatedBefore') || '',
    tags: params.get('tags') ? params.get('tags')!.split(',') : [],
    sort: params.get('sort') ? params.get('sort')!.split(',').map(s => {
      const [field, direction] = s.split(':');
      return { field: field as SortField, direction: (direction || 'asc') as SortDirection };
    }) : [
      { field: 'name' as SortField, direction: 'asc' as SortDirection }
    ],
    showAdvancedFilters: params.get('showFilters') === 'true'
  };
};

export const ClientsPage = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Filters>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isOtherSitesPending, setIsOtherSitesPending] = useState(false);
  const [createSiteResults, setCreateSiteResults] = useState<SiteResult[]>([]);
  const [updateSiteResults, setUpdateSiteResults] = useState<SiteResult[]>([]);
  const [currentEditStep, setCurrentEditStep] = useState<'edit' | 'send'>('edit');

  const urlParams = getURLParams();
  const [searchTerm, setSearchTerm] = useState(urlParams.branch);
  const [createdAfterDate, setCreatedAfterDate] = useState<Date | undefined>(
    urlParams.createdAfter ? new Date(urlParams.createdAfter) : undefined
  );
  const [createdBeforeDate, setCreatedBeforeDate] = useState<Date | undefined>(
    urlParams.createdBefore ? new Date(urlParams.createdBefore) : undefined
  );
  const [updatedAfterDate, setUpdatedAfterDate] = useState<Date | undefined>(
    urlParams.updatedAfter ? new Date(urlParams.updatedAfter) : undefined
  );
  const [updatedBeforeDate, setUpdatedBeforeDate] = useState<Date | undefined>(
    urlParams.updatedBefore ? new Date(urlParams.updatedBefore) : undefined
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(urlParams.tags);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(urlParams.showAdvancedFilters);
  const [page, setPage] = useState(urlParams.page);
  const [pageSize, setPageSize] = useState(urlParams.pageSize);
  const [sort, setSort] = useState<SortState[]>(urlParams.sort);

  const [tagsInput, setTagsInput] = useState('');

  const isInitialRender = useRef(true);

  const debouncedSearchTerm = useDebounce<string>(searchTerm);

  useEffect(() => {
    const sortParams = sort.map(s => `${s.field}:${s.direction}`);
    updateURL({
      page,
      pageSize,
      branch: searchTerm,
      createdAfter: createdAfterDate?.toISOString() || '',
      createdBefore: createdBeforeDate?.toISOString() || '',
      updatedAfter: updatedAfterDate?.toISOString() || '',
      updatedBefore: updatedBeforeDate?.toISOString() || '',
      tags: selectedTags,
      sort: sortParams,
      showFilters: showAdvancedFilters
    });
  }, [page, pageSize, searchTerm, createdAfterDate, createdBeforeDate, updatedAfterDate, updatedBeforeDate, selectedTags, sort, showAdvancedFilters]);

  const queryParams = {
    ...filters,
    page,
    page_size: pageSize,
    sort: sort.map(s => `${s.field}:${s.direction}`)
  };

  const { data, isLoading, isError, error, refetch } = $api.useQuery('get', '/client', {
    params: {
      query: queryParams,
    },
  });

  const siteCreateMutations = availableSites.reduce((acc, site) => {
    const siteApi = siteApis?.[site];
    if (siteApi) {
      acc[site] = siteApi.useMutation('post', '/client');
    }
    return acc;
  }, {} as Record<string, any>);

  const siteUpdateMutations = availableSites.reduce((acc, site) => {
    const siteApi = siteApis?.[site];
    if (siteApi) {
      acc[site] = siteApi.useMutation('patch', '/client/{clientName}');
    }
    return acc;
  }, {} as Record<string, any>);

  const createClientMutation = $api.useMutation('post', '/client', {
    onSuccess: () => {
      toast.success('Client created successfully');
      queryClient.invalidateQueries({ queryKey: ['get', '/client'] });
      setCreateError(null);
      setCreateSuccess(true);
    },
    onError: (error: { message: string }) => {
      console.error('Error creating client:', error);
      setCreateError(error.message);
    },
  });

  const updateClientMutation = $api.useMutation('patch', '/client/{clientName}', {
    onSuccess: () => {
      toast.success('Client updated successfully');
      queryClient.invalidateQueries({ queryKey: ['get', '/client'] });
      setUpdateError(null);
      setUpdateSuccess(true);
    },
    onError: (error: { message: string }) => {
      console.error('Error updating client:', error);
      setUpdateError(error.message);
    },
  });

  useEffect(() => {
    if (!isCreateDialogOpen) {
      setCreateError(null);
      setCreateSuccess(false);
      setCreateSiteResults([]);
    }
  }, [isCreateDialogOpen]);

  useEffect(() => {
    if (!isEditDialogOpen) {
      setUpdateError(null);
      setUpdateSuccess(false);
      setSelectedClient(null);
      setUpdateSiteResults([]);
      setCurrentEditStep('edit');
    }
  }, [isEditDialogOpen]);

  useEffect(() => {
    const newFilters: Filters = {};

    if (debouncedSearchTerm) {
      newFilters.branch = debouncedSearchTerm;
    }

    if (createdAfterDate) {
      newFilters.createdAfter = createdAfterDate.toISOString();
    }

    if (createdBeforeDate) {
      newFilters.createdBefore = createdBeforeDate.toISOString();
    }

    if (updatedAfterDate) {
      newFilters.updatedAfter = updatedAfterDate.toISOString();
    }

    if (updatedBeforeDate) {
      newFilters.updatedBefore = updatedBeforeDate.toISOString();
    }

    if (selectedTags.length > 0) {
      newFilters.tags = selectedTags;
    }

    setFilters(newFilters);
    
    if (!isInitialRender.current) {
      setPage(1);
    }
  }, [debouncedSearchTerm, createdAfterDate, createdBeforeDate, updatedAfterDate, updatedBeforeDate, selectedTags]);

  useEffect(() => {
    isInitialRender.current = false;
  }, []);

  const openEditDialog = (client: Client) => {
    setSelectedClient({ ...client });
    setIsEditDialogOpen(true);
  };

  const addTag = () => {
    if (tagsInput.trim() && !selectedTags.includes(tagsInput.trim())) {
      setSelectedTags([...selectedTags, tagsInput.trim()]);
      setTagsInput('');
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCreatedAfterDate(undefined);
    setCreatedBeforeDate(undefined);
    setUpdatedAfterDate(undefined);
    setUpdatedBeforeDate(undefined);
    setSelectedTags([]);
    setShowAdvancedFilters(false);
    setPage(1);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (createdAfterDate) count++;
    if (createdBeforeDate) count++;
    if (updatedAfterDate) count++;
    if (updatedBeforeDate) count++;
    if (selectedTags.length > 0) count++;
    return count;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  const handleSort = (field: SortField) => {
    setSort(prevSort => {
      const existingSort = prevSort.find(s => s.field === field);
      if (existingSort) {
        if (existingSort.direction === 'asc') {
          return prevSort.map(s => 
            s.field === field ? { ...s, direction: 'desc' as SortDirection } : s
          );
        } else {
          return prevSort.filter(s => s.field !== field);
        }
      } else {
        return [{ field, direction: 'asc' as SortDirection }, ...prevSort];
      }
    });
    setPage(1);
  };

  const getSortDirection = (field: SortField): SortDirection | null => {
    const sortItem = sort.find(s => s.field === field);
    return sortItem?.direction || null;
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize));
    setPage(1);
  };

  const handleCreateClient = (data: { body: Client }) => {
    if (!createClientMutation.isPending) {
      createClientMutation.mutate(data);
    }
  };

  const handleUpdateClient = (data: { params: { path: { clientName: string } }; body: NamelessClient }) => {
    if (!updateClientMutation.isPending) {
      updateClientMutation.mutate(data);
    }
  };

  const handleSendCreateToOtherSites = async (data: { body: Client; sites: string[] }) => {
    if (!data.sites.length) return;
    
    setIsOtherSitesPending(true);
    setCreateSiteResults([]);
    
    try {
      const results = await Promise.allSettled(
        data.sites.map(async (site) => {
          const mutation = siteCreateMutations[site];
          if (!mutation) {
            return { site, success: false, error: 'Site API not available' };
          }

          try {
            await mutation.mutateAsync({
              body: data.body,
            });
            return { site, success: true };
          } catch (error) {
            console.error(`Error creating client on site ${site}:`, error);
            const errorMessage = error instanceof Error 
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
            error: result.reason?.message || 'Promise rejected'
          };
        }
      });

      setCreateSiteResults(siteResultsData);

      const successfulSites = siteResultsData
        .filter((result) => result.success)
        .map((result) => result.site);

      const failedSites = siteResultsData
        .filter((result) => !result.success)
        .map((result) => result.site);

      if (successfulSites.length > 0) {
        toast.success(`Client successfully created on: ${successfulSites.join(', ')}`);
        queryClient.invalidateQueries({ queryKey: ['get', '/client'] });
      }

      if (failedSites.length > 0) {
        toast.error(`Failed to create client on: ${failedSites.join(', ')}`);
      }
    } catch (error) {
      console.error('Error in multi-site client creation:', error);
      toast.error('Error sending client to other sites');
    } finally {
      setIsOtherSitesPending(false);
    }
  };

  const handleSendUpdateToOtherSites = async (data: { params: { path: { clientName: string } }; body: NamelessClient; sites: string[] }) => {
    if (!data.sites.length) return;
    
    setIsOtherSitesPending(true);
    setUpdateSiteResults([]);
    
    try {
      const results = await Promise.allSettled(
        data.sites.map(async (site) => {
          const mutation = siteUpdateMutations[site];
          if (!mutation) {
            return { site, success: false, error: 'Site API not available' };
          }

          try {
            await mutation.mutateAsync({
              params: data.params,
              body: data.body,
            });
            return { site, success: true };
          } catch (error) {
            console.error(`Error updating client on site ${site}:`, error);
            const errorMessage = error instanceof Error 
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
            error: result.reason?.message || 'Promise rejected'
          };
        }
      });

      setUpdateSiteResults(siteResultsData);

      const successfulSites = siteResultsData
        .filter((result) => result.success)
        .map((result) => result.site);

      const failedSites = siteResultsData
        .filter((result) => !result.success)
        .map((result) => result.site);

      if (successfulSites.length > 0) {
        toast.success(`Client successfully updated on: ${successfulSites.join(', ')}`);
        queryClient.invalidateQueries({ queryKey: ['get', '/client'] });
      }

      if (failedSites.length > 0) {
        toast.error(`Failed to update client on: ${failedSites.join(', ')}`);
      }
    } catch (error) {
      console.error('Error in multi-site client update:', error);
      toast.error('Error sending client to other sites');
    } finally {
      setIsOtherSitesPending(false);
    }
  };

  const totalPages = data?.total ? Math.ceil(data.total / pageSize) : 0;
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, data?.total || 0);

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
          <p className="font-medium">Failed to load clients</p>
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
        <h1 className="text-2xl font-bold">Clients</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <div className="mb-6 space-y-4">
        {/* Main Filter Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by branch..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={cn(
                "gap-2",
                hasActiveFilters && "border-primary text-primary"
              )}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {getActiveFiltersCount()}
                </Badge>
              )}
              <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvancedFilters && "rotate-180")} />
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Branch: {searchTerm}
                <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {createdAfterDate && (
              <Badge variant="secondary" className="gap-1">
                Created after: {format(createdAfterDate, 'MMM d, yyyy')}
                <button onClick={() => setCreatedAfterDate(undefined)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {createdBeforeDate && (
              <Badge variant="secondary" className="gap-1">
                Created before: {format(createdBeforeDate, 'MMM d, yyyy')}
                <button onClick={() => setCreatedBeforeDate(undefined)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {updatedAfterDate && (
              <Badge variant="secondary" className="gap-1">
                Updated after: {format(updatedAfterDate, 'MMM d, yyyy')}
                <button onClick={() => setUpdatedAfterDate(undefined)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {updatedBeforeDate && (
              <Badge variant="secondary" className="gap-1">
                Updated before: {format(updatedBeforeDate, 'MMM d, yyyy')}
                <button onClick={() => setUpdatedBeforeDate(undefined)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                Tag: {tag}
                <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Advanced Filters
            </div>

            {/* Date Filters */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Date Range</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={cn(
                            'flex-1 justify-start text-left font-normal',
                            !createdAfterDate && 'text-muted-foreground'
                          )}
                        >
                          <Calendar className="mr-2 h-3 w-3" />
                          {createdAfterDate ? format(createdAfterDate, 'MMM d') : 'From'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent mode="single" selected={createdAfterDate} onSelect={setCreatedAfterDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={cn(
                            'flex-1 justify-start text-left font-normal',
                            !createdBeforeDate && 'text-muted-foreground'
                          )}
                        >
                          <Calendar className="mr-2 h-3 w-3" />
                          {createdBeforeDate ? format(createdBeforeDate, 'MMM d') : 'To'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent mode="single" selected={createdBeforeDate} onSelect={setCreatedBeforeDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Updated</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={cn(
                            'flex-1 justify-start text-left font-normal',
                            !updatedAfterDate && 'text-muted-foreground'
                          )}
                        >
                          <Calendar className="mr-2 h-3 w-3" />
                          {updatedAfterDate ? format(updatedAfterDate, 'MMM d') : 'From'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent mode="single" selected={updatedAfterDate} onSelect={setUpdatedAfterDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={cn(
                            'flex-1 justify-start text-left font-normal',
                            !updatedBeforeDate && 'text-muted-foreground'
                          )}
                        >
                          <Calendar className="mr-2 h-3 w-3" />
                          {updatedBeforeDate ? format(updatedBeforeDate, 'MMM d') : 'To'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent mode="single" selected={updatedBeforeDate} onSelect={setUpdatedBeforeDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="border-b border-muted mb-3"></div>
            </div>

            {/* Tags Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tags</Label>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="gap-1 text-xs">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                        <X className="h-2 w-2" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1"
                />
                <Button size="sm" onClick={addTag} disabled={!tagsInput.trim()}>
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[400px] overflow-hidden border rounded-md">
        <ClientsTable 
          clients={data?.items || []} 
          onEditClient={openEditDialog}
          onSort={handleSort}
          sortDirection={getSortDirection}
        />
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            <p className="text-sm font-medium">
              Page {page} of {totalPages}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog 
        open={isCreateDialogOpen} 
        onOpenChange={(open) => {
          if (!isOtherSitesPending) {
            setIsCreateDialogOpen(open);
          }
        }}
      >
        {isCreateDialogOpen && (
          <CreateClientModal
            onClose={() => setIsCreateDialogOpen(false)}
            onCreateClient={handleCreateClient}
            onSendToOtherSites={handleSendCreateToOtherSites}
            isPending={createClientMutation.isPending}
            isOtherSitesPending={isOtherSitesPending}
            error={createError}
            success={createSuccess}
            siteResults={createSiteResults}
            onOpenChange={(open) => {
              if (!isOtherSitesPending) {
                setIsCreateDialogOpen(open);
              }
            }}
          />
        )}
      </Dialog>
      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          if (!open && currentEditStep === 'send') {
            return;
          }
          setIsEditDialogOpen(open);
        }}
      >
        {isEditDialogOpen && (
          <EditClientModal
            client={selectedClient}
            onClose={() => setIsEditDialogOpen(false)}
            onUpdateClient={handleUpdateClient}
            onSendToOtherSites={handleSendUpdateToOtherSites}
            isPending={updateClientMutation.isPending}
            isOtherSitesPending={isOtherSitesPending}
            error={updateError}
            success={updateSuccess}
            siteResults={updateSiteResults}
            onOpenChange={setIsEditDialogOpen}
            onStepChange={setCurrentEditStep}
          />
        )}
      </Dialog>
    </div>
  );
};
