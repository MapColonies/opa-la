import { $api, siteApis } from '../../fetch';
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Loader2, Plus, Search, Calendar } from 'lucide-react';
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

type Client = components['schemas']['client'];
type NamelessClient = components['schemas']['namelessClient'];

type Filters = {
  branch?: string;
  createdBefore?: string;
  createdAfter?: string;
  updatedBefore?: string;
  updatedAfter?: string;
  tags?: string[];
};

export const ClientsPage = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Filters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isOtherSitesPending, setIsOtherSitesPending] = useState(false);

  const [createdAfterDate, setCreatedAfterDate] = useState<Date | undefined>(undefined);
  const [createdBeforeDate, setCreatedBeforeDate] = useState<Date | undefined>(undefined);
  const [updatedAfterDate, setUpdatedAfterDate] = useState<Date | undefined>(undefined);
  const [updatedBeforeDate, setUpdatedBeforeDate] = useState<Date | undefined>(undefined);

  const [tagsInput, setTagsInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const debouncedSearchTerm = useDebounce<string>(searchTerm);

  const { data, isLoading, isError, error, refetch } = $api.useQuery('get', '/client', {
    params: {
      query: filters,
    },
    staleTime: 0,
    cacheTime: 0,
  });

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
    }
  }, [isCreateDialogOpen]);

  useEffect(() => {
    if (!isEditDialogOpen) {
      setUpdateError(null);
      setUpdateSuccess(false);
      setSelectedClient(null);
    }
  }, [isEditDialogOpen]);

  useEffect(() => {
    if (data) {
      setClients(data);
    }
  }, [data]);

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
  }, [debouncedSearchTerm, createdAfterDate, createdBeforeDate, updatedAfterDate, updatedBeforeDate, selectedTags]);

  useEffect(() => {
    refetch();
  }, [refetch, filters]);

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
    
    try {
      const results = await Promise.allSettled(
        data.sites.map(async (site) => {
          const siteApi = siteApis?.[site];
          if (siteApi) {
            try {
              const mutation = siteApi.useMutation('post', '/client');
              await mutation.mutate({
                body: data.body,
              });
              return { site, success: true };
            } catch (error) {
              console.error(`Error creating client on site ${site}:`, error);
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
    
    try {
      const results = await Promise.allSettled(
        data.sites.map(async (site) => {
          const siteApi = siteApis?.[site];
          if (siteApi) {
            try {
              const mutation = siteApi.useMutation('patch', '/client/{clientName}');
              await mutation.mutate({
                params: data.params,
                body: data.body,
              });
              return { site, success: true };
            } catch (error) {
              console.error(`Error updating client on site ${site}:`, error);
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
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

          <Button variant="outline" onClick={resetFilters}>
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Created After</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !createdAfterDate && 'text-muted-foreground')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {createdAfterDate ? format(createdAfterDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent mode="single" selected={createdAfterDate} onSelect={setCreatedAfterDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Created Before</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !createdBeforeDate && 'text-muted-foreground')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {createdBeforeDate ? format(createdBeforeDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent mode="single" selected={createdBeforeDate} onSelect={setCreatedBeforeDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Updated After</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !updatedAfterDate && 'text-muted-foreground')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {updatedAfterDate ? format(updatedAfterDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent mode="single" selected={updatedAfterDate} onSelect={setUpdatedAfterDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Updated Before</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !updatedBeforeDate && 'text-muted-foreground')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {updatedBeforeDate ? format(updatedBeforeDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent mode="single" selected={updatedBeforeDate} onSelect={setUpdatedBeforeDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedTags.map((tag) => (
              <div key={tag} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
                <span>{tag}</span>
                <button onClick={() => removeTag(tag)} className="text-secondary-foreground hover:text-destructive">
                  ×
                </button>
              </div>
            ))}
          </div>
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
            />
            <Button onClick={addTag}>Add</Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden border rounded-md">
        <ClientsTable clients={clients} onEditClient={openEditDialog} />
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
          if (!isOtherSitesPending) {
            setIsEditDialogOpen(open);
          }
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
            onOpenChange={(open) => {
              if (!isOtherSitesPending) {
                setIsEditDialogOpen(open);
              }
            }}
          />
        )}
      </Dialog>
    </div>
  );
};
