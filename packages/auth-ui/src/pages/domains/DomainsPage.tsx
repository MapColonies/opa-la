import { useState, useEffect } from 'react';
import { $api } from '../../fetch';
import { Button } from '../../components/ui/button';
import { Loader2, Plus, Search } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Dialog } from '../../components/ui/dialog';
import { components } from '../../types/schema';
import { DomainsTable } from './DomainsTable';
import { CreateDomainModal } from './CreateDomainModal';
import { toast } from 'sonner';
import { useDebounce } from '../../hooks/useDebounce';

type Domain = components['schemas']['domain'];

export const DomainsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);

  const debouncedSearchTerm = useDebounce(searchTerm);

  const { data, isLoading, isError, error, refetch } = $api.useQuery('get', '/domain');

  const createDomainMutation = $api.useMutation('post', '/domain', {
    onSuccess: () => {
      setIsCreateDialogOpen(false);
      toast.success('Domain created successfully');
      refetch();
    },
    onError: (error) => {
      console.error('Error creating domain:', error);
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (data) {
      if (debouncedSearchTerm) {
        setDomains(data.filter((domain) => domain.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())));
      } else {
        setDomains(data);
      }
    }
  }, [data, debouncedSearchTerm]);

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
              onCreateDomain={createDomainMutation.mutate}
              isPending={createDomainMutation.isPending}
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
