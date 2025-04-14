import { useState, useEffect } from 'react';
import { components } from '../../types/schema';
import { Button } from '../../components/ui/button';
import { Loader2, X } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { $api } from '../../fetch';

type Connection = components['schemas']['connection'];
type Environment = components['schemas']['environment'];
type Client = components['schemas']['client'];
type Domain = components['schemas']['domain'];

interface EditConnectionModalProps {
  connection: Connection | null;
  onClose: () => void;
  onSave: (data: { body: Connection }) => void;
  isPending: boolean;
}

export const EditConnectionModal = ({ connection, onClose, onSave, isPending }: EditConnectionModalProps) => {
  const [editedConnection, setEditedConnection] = useState<Connection | null>(null);
  const [newOrigin, setNewOrigin] = useState('');
  const [useToken, setUseToken] = useState(false);

  const { data: clients, isLoading: isLoadingClients } = $api.useQuery('get', '/client');

  const { data: domains, isLoading: isLoadingDomains } = $api.useQuery('get', '/domain');

  useEffect(() => {
    if (connection) {
      setEditedConnection(connection);
      setUseToken(!!connection.token);
    }
  }, [connection]);

  if (!editedConnection) {
    return null;
  }

  const handleRemoveDomain = (domainToRemove: string) => {
    setEditedConnection((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        domains: prev.domains?.filter((domain) => domain !== domainToRemove) || [],
      };
    });
  };

  const handleAddOrigin = () => {
    if (newOrigin.trim() && !editedConnection.origins?.includes(newOrigin.trim())) {
      setEditedConnection((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          origins: [...(prev.origins || []), newOrigin.trim()],
        };
      });
      setNewOrigin('');
    }
  };

  const handleRemoveOrigin = (originToRemove: string) => {
    setEditedConnection((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        origins: prev.origins?.filter((origin) => origin !== originToRemove) || [],
      };
    });
  };

  const handleUpdateConnection = async () => {
    if (!editedConnection) return;

    if (!editedConnection.name || !editedConnection.environment) {
      toast.error('Name and Environment are required');
      return;
    }

    if (useToken && !editedConnection.token) {
      toast.error('Token is required when token is enabled');
      return;
    }

    const connectionToSave = {
      ...editedConnection,
      token: useToken ? editedConnection.token : '',
    };

    const { createdAt, ...finalConnection } = connectionToSave;

    onSave({
      body: finalConnection,
    });
  };

  const handleOriginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewOrigin(e.target.value);
  };

  const handleAllowedDomainsChange = (checked: boolean) => {
    setEditedConnection((prev) => {
      if (!prev) return prev;
      return { ...prev, allowNoBrowserConnection: checked };
    });
  };

  const handleAllowedOriginsChange = (checked: boolean) => {
    setEditedConnection((prev) => {
      if (!prev) return prev;
      return { ...prev, allowNoOriginConnection: checked };
    });
  };

  const handleClientChange = (clientName: string) => {
    setEditedConnection((prev) => {
      if (!prev) return prev;
      return { ...prev, name: clientName };
    });
  };

  const handleDomainSelect = (domainName: string) => {
    if (domainName && !editedConnection.domains?.includes(domainName)) {
      setEditedConnection((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          domains: [...(prev.domains || []), domainName],
        };
      });
    }
  };

  const handleTokenToggle = (checked: boolean) => {
    setUseToken(checked);
    if (!checked) {
      setEditedConnection((prev) => {
        if (!prev) return prev;
        return { ...prev, token: '' };
      });
    }
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Edit Connection</DialogTitle>
        <DialogDescription>Modify the connection details.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="client" className="text-right">
            Client
          </Label>
          <Select value={editedConnection.name} onValueChange={handleClientChange} disabled={true}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients?.map((client: Client) => (
                <SelectItem key={client.name} value={client.name}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="environment" className="text-right">
            Environment
          </Label>
          <Select
            value={editedConnection.environment}
            onValueChange={(value) =>
              setEditedConnection((prev) => {
                if (!prev) return prev;
                return { ...prev, environment: value as Environment };
              })
            }
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="np">Non-Production</SelectItem>
              <SelectItem value="stage">Stage</SelectItem>
              <SelectItem value="prod">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Use Token</Label>
          <div className="flex items-center space-x-2 col-span-3">
            <Switch checked={useToken} onCheckedChange={handleTokenToggle} />
            <Label>Create Your Own Token</Label>
          </div>
        </div>
        {useToken && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="token" className="text-right">
              Token
            </Label>
            <Input
              id="token"
              value={editedConnection.token}
              onChange={(e) =>
                setEditedConnection((prev) => {
                  if (!prev) return prev;
                  return { ...prev, token: e.target.value };
                })
              }
              className="col-span-3"
              placeholder="Connection token"
            />
          </div>
        )}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Status</Label>
          <div className="flex items-center space-x-2 col-span-3">
            <Switch
              checked={editedConnection.enabled}
              onCheckedChange={(checked) =>
                setEditedConnection((prev) => {
                  if (!prev) return prev;
                  return { ...prev, enabled: checked };
                })
              }
            />
            <Label>Enabled</Label>
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Browser Check</Label>
          <div className="flex items-center space-x-2 col-span-3">
            <Switch checked={editedConnection.allowNoBrowserConnection} onCheckedChange={handleAllowedDomainsChange} />
            <Label>Allow No Browser Connection</Label>
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Origin Check</Label>
          <div className="flex items-center space-x-2 col-span-3">
            <Switch checked={editedConnection.allowNoOriginConnection} onCheckedChange={handleAllowedOriginsChange} />
            <Label>Allow No Origin Connection</Label>
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="domains" className="text-right">
            Domains
          </Label>
          <div className="col-span-3 space-y-2">
            <div className="flex gap-2">
              <Select value="" onValueChange={handleDomainSelect} disabled={isLoadingDomains}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a domain" />
                </SelectTrigger>
                <SelectContent>
                  {domains?.map((domain: Domain) => (
                    <SelectItem key={domain.name} value={domain.name}>
                      {domain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {editedConnection.domains?.map((domain) => (
                <Badge key={domain} variant="secondary" className="flex items-center gap-1">
                  {domain}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleRemoveDomain(domain)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="origins" className="text-right">
            Origins
          </Label>
          <div className="col-span-3 space-y-2">
            <div className="flex gap-2">
              <Input
                id="origins"
                value={newOrigin}
                onChange={handleOriginChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddOrigin();
                  }
                }}
                placeholder="Add an origin"
              />
              <Button type="button" variant="outline" onClick={handleAddOrigin}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {editedConnection.origins?.map((origin) => (
                <Badge key={origin} variant="secondary" className="flex items-center gap-1">
                  {origin}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleRemoveOrigin(origin)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleUpdateConnection} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
