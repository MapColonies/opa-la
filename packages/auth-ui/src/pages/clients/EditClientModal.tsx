import { useState, useEffect } from 'react';
import { components } from '../../types/schema';
import { Button } from '../../components/ui/button';
import { Loader2, X } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { SiteSelection, availableSites } from '../../components/SiteSelection';

type Client = components['schemas']['client'];
type NamelessClient = components['schemas']['namelessClient'];

interface EditClientModalProps {
  client: Client | null;
  onClose: () => void;
  onUpdateClient: (data: { params: { path: { clientName: string } }; body: NamelessClient; sites: string[] }) => void;
  isPending: boolean;
}

export const EditClientModal = ({ client, onClose, onUpdateClient, isPending }: EditClientModalProps) => {
  const [editedClient, setEditedClient] = useState<Client | null>(null);
  const [editTag, setEditTag] = useState('');
  const [selectedSites, setSelectedSites] = useState<string[]>(availableSites);

  useEffect(() => {
    if (client) {
      setEditedClient({ ...client });
      setSelectedSites(availableSites);
    }
  }, [client]);

  const handleAddEditTag = () => {
    if (editTag.trim() && editedClient && !editedClient.tags?.includes(editTag.trim())) {
      setEditedClient((prev) =>
        prev
          ? {
              ...prev,
              tags: [...(prev.tags || []), editTag.trim()],
            }
          : null
      );
      setEditTag('');
    }
  };

  const handleRemoveEditTag = (tagToRemove: string) => {
    if (editedClient) {
      setEditedClient({
        ...editedClient,
        tags: editedClient.tags?.filter((tag) => tag !== tagToRemove) || [],
      });
    }
  };

  const handleEditClient = async () => {
    if (!editedClient) return;

    onUpdateClient({
      params: {
        path: {
          clientName: editedClient.name,
        },
      },
      body: {
        hebName: editedClient.hebName,
        description: editedClient.description,
        branch: editedClient.branch,
        tags: editedClient.tags,
        techPointOfContact: editedClient.techPointOfContact || undefined,
        productPointOfContact: editedClient.productPointOfContact || undefined,
      } as NamelessClient,
      sites: selectedSites,
    });
  };

  if (!editedClient) {
    return null;
  }

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Edit Client</DialogTitle>
        <DialogDescription>Update the client details.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-name" className="text-right">
            Name
          </Label>
          <Input id="edit-name" value={editedClient.name} disabled={true} className="col-span-3 bg-muted" placeholder="Client name" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-hebName" className="text-right">
            Hebrew Name
          </Label>
          <Input
            id="edit-hebName"
            value={editedClient.hebName}
            onChange={(e) => setEditedClient((prev) => (prev ? { ...prev, hebName: e.target.value } : null))}
            className="col-span-3"
            placeholder="Hebrew name"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-description" className="text-right">
            Description
          </Label>
          <Textarea
            id="edit-description"
            value={editedClient.description}
            onChange={(e) => setEditedClient((prev) => (prev ? { ...prev, description: e.target.value } : null))}
            className="col-span-3"
            placeholder="Client description"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-branch" className="text-right">
            Branch
          </Label>
          <Input
            id="edit-branch"
            value={editedClient.branch}
            onChange={(e) => setEditedClient((prev) => (prev ? { ...prev, branch: e.target.value } : null))}
            className="col-span-3"
            placeholder="Branch name"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-createdAt" className="text-right">
            Created At
          </Label>
          <Input id="edit-createdAt" value={editedClient.createdAt} disabled={true} className="col-span-3 bg-muted" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-updatedAt" className="text-right">
            Updated At
          </Label>
          <Input id="edit-updatedAt" value={editedClient.updatedAt} disabled={true} className="col-span-3 bg-muted" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="edit-tags" className="text-right">
            Tags
          </Label>
          <div className="col-span-3 space-y-2">
            <div className="flex gap-2">
              <Input
                id="edit-tags"
                value={editTag}
                onChange={(e) => setEditTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEditTag();
                  }
                }}
                placeholder="Add a tag"
              />
              <Button type="button" variant="outline" onClick={handleAddEditTag}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {editedClient.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleRemoveEditTag(tag)}
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
        <Button onClick={handleEditClient} disabled={isPending || selectedSites.length === 0}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            'Update Client'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
