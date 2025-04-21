import { $api, siteApis } from '../../fetch';
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Loader2, Plus, Search, Calendar } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Dialog, DialogTrigger } from '../../components/ui/dialog';
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
  const [filters, setFilters] = useState<Filters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

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
  });

  const [isCreatePending, setIsCreatePending] = useState(false);
  const [isUpdatePending, setIsUpdatePending] = useState(false);

  const siteMutations = Object.keys(siteApis || {}).reduce(
    (acc, site) => {
      const createMutation = siteApis?.[site]?.useMutation('post', '/client', {
        onSuccess: () => {
          toast.success(`Client created successfully on ${site}`);
        },
        onError: (error) => {
          console.error(`Error creating client on site: ${site}`, error);
          toast.error(`Error on ${site}: ${error.message}`);
        },
      });

      const updateMutation = siteApis?.[site]?.useMutation('patch', '/client/{clientName}', {
        onSuccess: () => {
          toast.success(`Client updated successfully on ${site}`);
        },
        onError: (error) => {
          console.error(`Error updating client on site: ${site}`, error);
          toast.error(`Error on ${site}: ${error.message}`);
        },
      });

      if (createMutation && updateMutation) {
        acc[site] = {
          create: createMutation as any,
          update: updateMutation as any,
        };
      }

      return acc;
    },
    {} as Record<
      string,
      {
        create: { mutate: (data: any) => any };
        update: { mutate: (data: any) => any };
      }
    >
  );

  const createClientMutation = {
    mutate: async (data: { body: Client; sites: string[] }) => {
      setIsCreatePending(true);
      try {
        const siteKeys = data.sites;

        if (siteKeys.length === 0) {
          toast.error('Please select at least one site for client creation');
          return;
        }

        const results = await Promise.allSettled(
          siteKeys.map(async (site) => {
            const mutation = siteMutations[site]?.create;
            if (mutation) {
              try {
                await mutation.mutate({ body: data.body });
                return { site, success: true };
              } catch (error) {
                return { site, success: false, error };
              }
            }
            return { site, success: true };
          })
        );

        const successfulSites = results
          .filter((result) => result.status === 'fulfilled' && result.value.success)
          .map((result) => (result as PromiseFulfilledResult<{ site: string }>).value.site);

        const failedSites = results
          .filter((result) => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success))
          .map((result) => {
            if (result.status === 'rejected') {
              return (result as PromiseRejectedResult).reason?.site || 'unknown';
            }
            return (result as PromiseFulfilledResult<{ site: string }>).value.site;
          });

        if (successfulSites.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          setIsCreateDialogOpen(false);
          await refetch();
        }

        if (failedSites.length > 0) {
          toast.error(`Failed to create client on ${failedSites.join(', ')}`);
        }
      } catch (error) {
        console.error('Error in multi-site client creation:', error);
        toast.error('Failed to create client on all sites');
      } finally {
        setIsCreatePending(false);
      }
    },
    isPending: isCreatePending,
  };

  const updateClientMutation = {
    mutate: async (data: { params: { path: { clientName: string } }; body: NamelessClient; sites: string[] }) => {
      setIsUpdatePending(true);
      try {
        const siteKeys = data.sites;

        if (siteKeys.length === 0) {
          toast.error('Please select at least one site for client update');
          return;
        }

        const results = await Promise.allSettled(
          siteKeys.map(async (site) => {
            const mutation = siteMutations[site]?.update;
            if (mutation) {
              try {
                await mutation.mutate({
                  params: data.params,
                  body: data.body,
                });
                return { site, success: true };
              } catch (error) {
                return { site, success: false, error };
              }
            }
            return { site, success: true };
          })
        );

        const successfulSites = results
          .filter((result) => result.status === 'fulfilled' && result.value.success)
          .map((result) => (result as PromiseFulfilledResult<{ site: string }>).value.site);

        const failedSites = results
          .filter((result) => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success))
          .map((result) => {
            if (result.status === 'rejected') {
              return (result as PromiseRejectedResult).reason?.site || 'unknown';
            }
            return (result as PromiseFulfilledResult<{ site: string }>).value.site;
          });

        if (successfulSites.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          setIsEditDialogOpen(false);
          setSelectedClient(null);
          await refetch();
        }

        if (failedSites.length > 0) {
          toast.error(`Failed to update client on ${failedSites.join(', ')}`);
        }
      } catch (error) {
        console.error('Error in multi-site client update:', error);
        toast.error('Failed to update client on all sites');
      } finally {
        setIsUpdatePending(false);
        setIsEditDialogOpen(false);
      }
    },
    isPending: isUpdatePending,
  };

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
    <div className="container mx-auto py-10">
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </DialogTrigger>
            {isCreateDialogOpen && (
              <CreateClientModal
                onClose={() => setIsCreateDialogOpen(false)}
                onCreateClient={createClientMutation.mutate}
                isPending={createClientMutation.isPending}
              />
            )}
          </Dialog>
        </div>

        <div className="flex flex-col gap-4">
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
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !createdAfterDate && 'text-muted-foreground')}
                  >
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
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !createdBeforeDate && 'text-muted-foreground')}
                  >
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
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !updatedAfterDate && 'text-muted-foreground')}
                  >
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
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !updatedBeforeDate && 'text-muted-foreground')}
                  >
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
      </div>

      <ClientsTable clients={clients} onEditClient={openEditDialog} />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        {isEditDialogOpen && (
          <EditClientModal
            client={selectedClient}
            onClose={() => setIsEditDialogOpen(false)}
            onUpdateClient={updateClientMutation.mutate}
            isPending={updateClientMutation.isPending}
          />
        )}
      </Dialog>
    </div>
  );
};
