import { useState, useEffect } from 'react';
import { $api, siteApis } from '../../fetch';
import { Button } from '../../components/ui/button';
import { Loader2, Plus, Filter, X, Search, ChevronDown } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Dialog } from '../../components/ui/dialog';
import { components } from '../../types/schema';
import { ConnectionsTable } from './ConnectionsTable';
import { CreateConnectionModal } from './CreateConnectionModal';
import { EditConnectionModal } from './EditConnectionModal';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { useQueryClient } from '@tanstack/react-query';
import { availableSites } from '../../components/SiteSelection';
import { Badge } from '../../components/ui/badge';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../lib/utils';

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

export const ConnectionsPage = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Filters>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | 'all'>('all');
  const [isEnabled, setIsEnabled] = useState<boolean | undefined>(undefined);
  const [isNoBrowser, setIsNoBrowser] = useState<boolean | undefined>(undefined);
  const [isNoOrigin, setIsNoOrigin] = useState<boolean | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [isOtherSitesPending, setIsOtherSitesPending] = useState(false);
  const [siteResults, setSiteResults] = useState<SiteResult[]>([]);
  
  const debouncedSearchTerm = useDebounce(searchTerm);

  const { data, isLoading, isError, error, refetch } = $api.useQuery('get', '/connection', {
    params: {
      query: filters,
    },
  });

  const siteMutations = availableSites.reduce((acc, site) => {
    const siteApi = siteApis?.[site];
    if (siteApi) {
      acc[site] = siteApi.useMutation('post', '/connection');
    }
    return acc;
  }, {} as Record<string, any>);

  const upsertConnectionMutation = $api.useMutation('post', '/connection', {
    onSuccess: () => {
      setCreateSuccess(true);
      setEditSuccess(true);
      refetch();
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
  }, [selectedEnvironment, isEnabled, isNoBrowser, isNoOrigin]);

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

      setSiteResults(siteResultsData);

      const successfulSites = siteResultsData
        .filter((result) => result.success)
        .map((result) => result.site);

      const failedSites = siteResultsData
        .filter((result) => !result.success)
        .map((result) => result.site);

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
  };

  const removeFilter = (filterType: string) => {
    switch (filterType) {
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
  };

  const filteredData = data?.filter((connection) => {
    if (!debouncedSearchTerm) return true;
    const searchLower = debouncedSearchTerm.toLowerCase();
    return (
      connection.name?.toLowerCase().includes(searchLower) ||
      connection.environment?.toLowerCase().includes(searchLower) ||
      connection.token?.toLowerCase().includes(searchLower)
    );
  });

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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
              onOpenChange={setIsCreateDialogOpen}
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
              placeholder="Search connections..."
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
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1">
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
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
                    <Label htmlFor="isEnabled" className="text-sm">Enabled</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isNoBrowser"
                      checked={isNoBrowser === true}
                      onCheckedChange={(checked: boolean | 'indeterminate') => setIsNoBrowser(checked === true ? true : undefined)}
                    />
                    <Label htmlFor="isNoBrowser" className="text-sm">No Browser</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isNoOrigin"
                      checked={isNoOrigin === true}
                      onCheckedChange={(checked: boolean | 'indeterminate') => setIsNoOrigin(checked === true ? true : undefined)}
                    />
                    <Label htmlFor="isNoOrigin" className="text-sm">No Origin</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[400px] overflow-hidden border rounded-md">
        <ConnectionsTable connections={filteredData || []} onEditConnection={openEditDialog} />
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
