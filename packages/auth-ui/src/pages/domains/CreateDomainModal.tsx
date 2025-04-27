import { useState } from 'react';
import { components } from '../../types/schema';
import { Button } from '../../components/ui/button';
import { Loader2 } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';

type Domain = components['schemas']['domain'];

interface CreateDomainModalProps {
  onClose: () => void;
  onCreateDomain: (data: { body: Domain }) => void;
  isPending: boolean;
}

export const CreateDomainModal = ({ onClose, onCreateDomain, isPending }: CreateDomainModalProps) => {
  const [newDomain, setNewDomain] = useState<Partial<Domain>>({
    name: '',
  });

  const handleCreateDomain = async () => {
    if (!newDomain.name) {
      toast.error('Domain name is required');
      return;
    }

    onCreateDomain({
      body: newDomain as Domain,
    });
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Create New Domain</DialogTitle>
        <DialogDescription>Fill in the details to create a new domain.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input
            id="name"
            value={newDomain.name}
            onChange={(e) => setNewDomain((prev) => ({ ...prev, name: e.target.value }))}
            className="col-span-3"
            placeholder="Domain name"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleCreateDomain} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Domain'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
