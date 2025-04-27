import { useState } from 'react';
import { components } from '../../types/schema';
import { Button } from '../../components/ui/button';
import { Loader2, X, Check, ChevronsUpDown, HelpCircle } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../../components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { cn } from '../../lib/utils';
import { $api } from '../../fetch';

type Connection = components['schemas']['connection'];
type Environment = components['schemas']['environment'];
type Client = components['schemas']['client'];
type Domain = components['schemas']['domain'];

interface CreateConnectionModalProps {
  onClose: () => void;
  onSave: (data: { body: Connection }) => void;
  isPending: boolean;
}

export const CreateConnectionModal = ({ onClose, onSave, isPending }: CreateConnectionModalProps) => {
  const [newConnection, setNewConnection] = useState<Partial<Connection>>({
    name: '',
    environment: 'np',
    version: 1,
    enabled: true,
    token: '',
    domains: [],
    allowNoBrowserConnection: false,
    allowNoOriginConnection: false,
    origins: [],
  });

  const [newOrigin, setNewOrigin] = useState('');
  const [useToken, setUseToken] = useState(false);
  const [open, setOpen] = useState(false);

  const { data: clients, isLoading: isLoadingClients } = $api.useQuery('get', '/client');

  const { data: domains, isLoading: isLoadingDomains } = $api.useQuery('get', '/domain');

  const handleRemoveDomain = (domainToRemove: string) => {
    setNewConnection((prev) => ({
      ...prev,
      domains: prev.domains?.filter((domain) => domain !== domainToRemove) || [],
    }));
  };

  const handleAddOrigin = () => {
    if (newOrigin.trim() && !newConnection.origins?.includes(newOrigin.trim())) {
      setNewConnection((prev) => ({
        ...prev,
        origins: [...(prev.origins || []), newOrigin.trim()],
      }));
      setNewOrigin('');
    }
  };

  const handleRemoveOrigin = (originToRemove: string) => {
    setNewConnection((prev) => ({
      ...prev,
      origins: prev.origins?.filter((origin) => origin !== originToRemove) || [],
    }));
  };

  const handleCreateConnection = async () => {
    if (!newConnection.name || !newConnection.environment) {
      toast.error('Name and Environment are required');
      return;
    }

    if (useToken && !newConnection.token) {
      toast.error('Token is required when token is enabled');
      return;
    }

    const connectionToSave = {
      ...newConnection,
      token: useToken ? newConnection.token : '',
    } as Connection;

    onSave({
      body: connectionToSave,
    });
  };

  const handleOriginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewOrigin(e.target.value);
  };

  const handleAllowedDomainsChange = (checked: boolean) => {
    setNewConnection((prev) => ({ ...prev, allowNoBrowserConnection: checked }));
  };

  const handleAllowedOriginsChange = (checked: boolean) => {
    setNewConnection((prev) => ({ ...prev, allowNoOriginConnection: checked }));
  };

  const handleClientChange = (clientName: string) => {
    setNewConnection((prev) => ({ ...prev, name: clientName }));
  };

  const handleDomainSelect = (domainName: string) => {
    if (domainName && !newConnection.domains?.includes(domainName)) {
      setNewConnection((prev) => ({
        ...prev,
        domains: [...(prev.domains || []), domainName],
      }));
    }
  };

  const handleTokenToggle = (checked: boolean) => {
    setUseToken(checked);
    if (!checked) {
      setNewConnection((prev) => ({ ...prev, token: '' }));
    }
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Create New Connection</DialogTitle>
        <DialogDescription>Fill in the details to create a new connection.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="client" className="text-right">
            Client
          </Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="col-span-3 justify-between w-full"
                disabled={isLoadingClients}
              >
                {newConnection.name ? newConnection.name : 'Select a client...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search client..." />
                <CommandEmpty>No client found.</CommandEmpty>
                <CommandGroup>
                  {clients?.map((client: Client) => (
                    <CommandItem
                      key={client.name}
                      value={client.name}
                      onSelect={() => {
                        handleClientChange(client.name);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn('mr-2 h-4 w-4', newConnection.name === client.name ? 'opacity-100' : 'opacity-0')} />
                      {client.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="environment" className="text-right">
            Environment
          </Label>
          <Select
            value={newConnection.environment}
            onValueChange={(value) => setNewConnection((prev) => ({ ...prev, environment: value as Environment }))}
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
          <Label className="text-right">Status</Label>
          <div className="flex items-center space-x-2 col-span-3">
            <Switch checked={newConnection.enabled} onCheckedChange={(checked) => setNewConnection((prev) => ({ ...prev, enabled: checked }))} />
            <Label>{newConnection.enabled ? 'Enabled' : 'Disabled'}</Label>
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Generate Token</Label>
          <div className="flex items-center space-x-2 col-span-3">
            <Switch checked={!useToken} onCheckedChange={(checked) => handleTokenToggle(!checked)} />
          </div>
        </div>
        {useToken && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="token" className="text-right">
              Token
            </Label>
            <Input
              id="token"
              value={newConnection.token}
              onChange={(e) => setNewConnection((prev) => ({ ...prev, token: e.target.value }))}
              className="col-span-3"
              placeholder="Connection token"
            />
          </div>
        )}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Browser Check</Label>
          <div className="flex items-center space-x-2 col-span-3">
            <Switch checked={newConnection.allowNoBrowserConnection} onCheckedChange={handleAllowedDomainsChange} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Allow connections without browser validation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Origin Check</Label>
          <div className="flex items-center space-x-2 col-span-3">
            <Switch checked={newConnection.allowNoOriginConnection} onCheckedChange={handleAllowedOriginsChange} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Allow connections without origin validation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
              {newConnection.domains?.map((domain) => (
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
              {newConnection.origins?.map((origin) => (
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
        <Button onClick={handleCreateConnection} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Connection'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
