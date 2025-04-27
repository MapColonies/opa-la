import { useState } from 'react';
import { components } from '../../types/schema';
import { Button } from '../../components/ui/button';
import { Loader2, X } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { SiteSelection, availableSites } from '../../components/SiteSelection';

type Client = components['schemas']['client'];

interface CreateClientModalProps {
  onClose: () => void;
  onCreateClient: (data: { body: Client; sites: string[] }) => void;
  isPending: boolean;
}

const isHebrewText = (text: string): boolean => {
  return /^[\u0590-\u05FF0-9\s]+$/.test(text);
};

export const CreateClientModal = ({ onClose, onCreateClient, isPending }: CreateClientModalProps) => {
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    hebName: '',
    description: '',
    branch: '',
    tags: [],
  });

  const [newTag, setNewTag] = useState('');
  const [selectedSites, setSelectedSites] = useState<string[]>(availableSites);
  const [hebNameError, setHebNameError] = useState<string | null>(null);

  const handleAddNewTag = () => {
    if (newTag.trim() && !newClient.tags?.includes(newTag.trim())) {
      setNewClient((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveNewTag = (tagToRemove: string) => {
    setNewClient((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  const handleHebNameChange = (value: string) => {
    setNewClient((prev) => ({ ...prev, hebName: value }));

    if (!value.trim()) {
      setHebNameError(null);
      return;
    }

    if (!isHebrewText(value)) {
      setHebNameError('Hebrew Name must contain only Hebrew characters and numbers');
    } else {
      setHebNameError(null);
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.name || !newClient.hebName) {
      toast.error('Name and Hebrew Name are required');
      return;
    }

    if (!isHebrewText(newClient.hebName)) {
      setHebNameError('Hebrew Name must contain only Hebrew characters and numbers');
      toast.error('Hebrew Name must contain only Hebrew characters and numbers');
      return;
    }

    onCreateClient({
      body: newClient as Client,
      sites: selectedSites,
    });
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Create New Client</DialogTitle>
        <DialogDescription>Fill in the details to create a new client.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input
            id="name"
            value={newClient.name}
            onChange={(e) => setNewClient((prev) => ({ ...prev, name: e.target.value }))}
            className="col-span-3"
            placeholder="Client name"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="hebName" className="text-right">
            Hebrew Name
          </Label>
          <div className="col-span-3 space-y-1">
            <Input
              id="hebName"
              value={newClient.hebName}
              onChange={(e) => handleHebNameChange(e.target.value)}
              className={hebNameError ? 'border-red-500' : ''}
              placeholder="Hebrew name"
            />
            {hebNameError && <p className="text-sm text-red-500">{hebNameError}</p>}
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">
            Description
          </Label>
          <Textarea
            id="description"
            value={newClient.description}
            onChange={(e) => setNewClient((prev) => ({ ...prev, description: e.target.value }))}
            className="col-span-3"
            placeholder="Client description"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="branch" className="text-right">
            Branch
          </Label>
          <Input
            id="branch"
            value={newClient.branch}
            onChange={(e) => setNewClient((prev) => ({ ...prev, branch: e.target.value }))}
            className="col-span-3"
            placeholder="Branch name"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="tags" className="text-right">
            Tags
          </Label>
          <div className="col-span-3 space-y-2">
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewTag();
                  }
                }}
                placeholder="Add a tag"
              />
              <Button type="button" variant="outline" onClick={handleAddNewTag}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {newClient.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleRemoveNewTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <SiteSelection selectedSites={selectedSites} setSelectedSites={setSelectedSites} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleCreateClient} disabled={isPending || selectedSites.length === 0 || !!hebNameError}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Client'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
