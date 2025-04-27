import { useState, useEffect } from 'react';
import { $api } from '../../fetch';
import { Button } from '../../components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { Dialog } from '../../components/ui/dialog';
import { components } from '../../types/schema';
import { ConnectionsTable } from './ConnectionsTable';
import { CreateConnectionModal } from './CreateConnectionModal';
import { EditConnectionModal } from './EditConnectionModal';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';

type Connection = components['schemas']['connection'];
type Environment = components['schemas']['environment'];

interface Filters {
  environment?: Environment[];
  isEnabled?: boolean;
  isNoBrowser?: boolean;
  isNoOrigin?: boolean;
  domains?: string[];
}

export const ConnectionsPage = () => {
  const [filters, setFilters] = useState<Filters>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | 'all'>('all');
  const [isEnabled, setIsEnabled] = useState<boolean | undefined>(undefined);
  const [isNoBrowser, setIsNoBrowser] = useState<boolean | undefined>(undefined);
  const [isNoOrigin, setIsNoOrigin] = useState<boolean | undefined>(undefined);

  const { data, isLoading, isError, error, refetch } = $api.useQuery('get', '/connection', {
    params: {
      query: filters,
    },
  });

  const upsertConnectionMutation = $api.useMutation('post', '/connection', {
    onSuccess: () => {
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedConnection(null);
      toast.success('Connection saved successfully');
      refetch();
    },
    onError: (error) => {
      console.error('Error saving connection:', error);
      toast.error(error.message);
    },
  });

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

  const openEditDialog = (connection: Connection) => {
    setSelectedConnection({ ...connection });
    setIsEditDialogOpen(true);
  };

  const resetFilters = () => {
    setSelectedEnvironment('all');
    setIsEnabled(undefined);
    setIsNoBrowser(undefined);
    setIsNoOrigin(undefined);
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
              onSave={upsertConnectionMutation.mutate}
              isPending={upsertConnectionMutation.isPending}
            />
          )}
        </Dialog>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Select value={selectedEnvironment} onValueChange={(value) => setSelectedEnvironment(value as Environment | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Environments</SelectItem>
                <SelectItem value="np">Non-Production</SelectItem>
                <SelectItem value="stage">Stage</SelectItem>
                <SelectItem value="prod">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isEnabled"
              checked={isEnabled === true}
              onCheckedChange={(checked: boolean | 'indeterminate') => setIsEnabled(checked === true ? true : undefined)}
            />
            <Label htmlFor="isEnabled">Enabled</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isNoBrowser"
              checked={isNoBrowser === true}
              onCheckedChange={(checked: boolean | 'indeterminate') => setIsNoBrowser(checked === true ? true : undefined)}
            />
            <Label htmlFor="isNoBrowser">No Browser</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isNoOrigin"
              checked={isNoOrigin === true}
              onCheckedChange={(checked: boolean | 'indeterminate') => setIsNoOrigin(checked === true ? true : undefined)}
            />
            <Label htmlFor="isNoOrigin">No Origin</Label>
          </div>

          <Button variant="outline" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-[400px] overflow-hidden border rounded-md">
        <ConnectionsTable connections={data || []} onEditConnection={openEditDialog} />
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        {isEditDialogOpen && (
          <EditConnectionModal
            connection={selectedConnection}
            onClose={() => setIsEditDialogOpen(false)}
            onSave={upsertConnectionMutation.mutate}
            isPending={upsertConnectionMutation.isPending}
          />
        )}
      </Dialog>
    </div>
  );
};
