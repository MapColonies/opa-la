import type { ReactNode } from 'react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  confirmVariant?: 'default' | 'destructive';
  /** Named for what saying no does, not for the button that does it. */
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A yes-or-no gate in front of something that cannot be undone. An asset has no content
 * history and no delete, so both directions out of an edit — saving it and throwing it
 * away — are irreversible and both ask first.
 */
export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant = 'default',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => (
  <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
