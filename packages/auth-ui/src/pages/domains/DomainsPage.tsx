import { useState, useEffect } from 'react';
import { $api, siteApis } from '../../fetch';
import { Button } from '../../components/ui/button';
import { Loader2, Plus, Search, Filter, X } from 'lucide-react';
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

type Domain = components['schemas']['domain'];

type SiteResult = {
  site: string;
  success: boolean;
  error?: string;
};

export const DomainsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [isOtherSitesPending, setIsOtherSitesPending] = useState(false);
  const [siteResults, setSiteResults] = useState<SiteResult[]>([]);
  const queryClient = useQueryClient();

  const debouncedSearchTerm = useDebounce(searchTerm);

  const { data, isLoading, isError, error, refetch } = $api.useQuery('get', '/domain');

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    return count;
  };

  const clearAllFilters = () => {
    setSearchTerm('');
  };

  const siteMutations = availableSites.reduce((acc, site) => {
    const siteApi = siteApis?.[site];
    if (siteApi) {
      acc[site] = siteApi.useMutation('post', '/domain');
    }
    return acc;
  }, {} as Record<string, any>);

  const createDomainMutation = $api.useMutation('post', '/domain', {
    onSuccess: () => {
      setCreateSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['get', '/domain'] });
      refetch();
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
    }
  }, [isCreateDialogOpen]);

  useEffect(() => {
    if (data) {
      if (debouncedSearchTerm) {
        setDomains(data.filter((domain) => domain.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())));
      } else {
        setDomains(data);
      }
    }
  }, [data, debouncedSearchTerm]);

  const handleCreateDomain = (data: { body: Domain }) => {
    setCreateError(null);
    createDomainMutation.mutate(data);
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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
            />
          )}
        </Dialog>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
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
            {getActiveFiltersCount() > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            )}
          </div>
        </div>

        {searchTerm && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              Search: {searchTerm}
              <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}

        {showAdvancedFilters && (
          <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
            <div className="text-sm text-muted-foreground">
              Additional filters will be available here as needed.
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[400px] overflow-hidden border rounded-md">
        <DomainsTable domains={domains.length > 0 ? domains : data || []} />
      </div>
    </div>
  );
};
