import { useState, useEffect } from 'react';
import { $api, siteApis } from '../../fetch';
import { Button } from '../../components/ui/button';
import { Loader2, Plus, Search } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Dialog } from '../../components/ui/dialog';
import { components } from '../../types/schema';
import { DomainsTable } from './DomainsTable';
import { CreateDomainModal } from './CreateDomainModal';
import { toast } from 'sonner';
import { useDebounce } from '../../hooks/useDebounce';
import { useQueryClient } from '@tanstack/react-query';

type Domain = components['schemas']['domain'];

export const DomainsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [isOtherSitesPending, setIsOtherSitesPending] = useState(false);
  const queryClient = useQueryClient();

  const debouncedSearchTerm = useDebounce(searchTerm);

  const { data, isLoading, isError, error, refetch } = $api.useQuery('get', '/domain');

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
    
    try {
      const results = await Promise.allSettled(
        data.sites.map(async (site) => {
          const siteApi = siteApis?.[site];
          if (siteApi) {
            try {
              const mutation = siteApi.useMutation('post', '/domain');
              await mutation.mutate({
                body: data.body,
              });
              return { site, success: true };
            } catch (error) {
              console.error(`Error sending domain to site ${site}:`, error);
              return { site, success: false, error };
            }
          }
          return { site, success: false, error: 'Site API not available' };
        })
      );

      const successfulSites = results
        .filter((result) => result.status === 'fulfilled' && result.value.success)
        .map((result) => (result as PromiseFulfilledResult<{ site: string }>).value.site);

      const failedSites = results
        .filter((result) => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success))
        .map((result) => {
          if (result.status === 'rejected') {
            return 'unknown';
          }
          return (result as PromiseFulfilledResult<{ site: string; success: boolean }>).value.site;
        });

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
        </div>
      </div>

      <div className="flex-1 min-h-[400px] overflow-hidden border rounded-md">
        <DomainsTable domains={domains.length > 0 ? domains : data || []} />
      </div>
    </div>
  );
};
