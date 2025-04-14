import { $api } from '../../fetch';
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

  const createClientMutation = $api.useMutation('post', '/client', {
    onSuccess: () => {
      setIsCreateDialogOpen(false);
      toast.success('Client created successfully');
      refetch();
    },
    onError: (error) => {
      console.error('Error creating client:', error);
      toast.error(error.message);
    },
  });

  const updateClientMutation = $api.useMutation('patch', '/client/{clientName}', {
    onSuccess: () => {
      setIsEditDialogOpen(false);
      setSelectedClient(null);
      toast.success('Client updated successfully');
      refetch();
    },
    onError: (error) => {
      console.error('Error updating client:', error);
      toast.error(error.message);
    },
  });

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
            <CreateClientModal
              onClose={() => setIsCreateDialogOpen(false)}
              onCreateClient={createClientMutation.mutate}
              isPending={createClientMutation.isPending}
            />
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
        <EditClientModal
          client={selectedClient}
          onClose={() => setIsEditDialogOpen(false)}
          onUpdateClient={updateClientMutation.mutate}
          isPending={updateClientMutation.isPending}
        />
      </Dialog>
    </div>
  );
};
