import { useId, useState } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { SiteSelection } from './SiteSelection';
import { getAvailableSites } from './exports';

type SiteResult = {
  site: string;
  success: boolean;
  error?: string;
};

type Step = 'confirm' | 'send';

interface DeleteRecordModalProps {
  recordType: 'domain' | 'client';
  recordName: string;
  /** Deletes the record on the current site. Rejects with the server's error body when refused. */
  onDelete: () => Promise<unknown>;
  /** Deletes the same record on another site. Rejects like `onDelete`. */
  onDeleteOnSite: (site: string) => Promise<unknown>;
  onClose: () => void;
}

const availableSites = getAvailableSites();

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** The server's message, out of whatever a failed request rejected with. */
const errorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) return String(error.message);
  return JSON.stringify(error);
};

/**
 * Deletes a record on the current site and then, like the create and edit modals, offers
 * to send the same delete to the other sites. The send step only follows a local success:
 * whether the record is in use is the server's to say, through its refusal.
 */
export const DeleteRecordModal = ({ recordType, recordName, onDelete, onDeleteOnSite, onClose }: DeleteRecordModalProps) => {
  const [step, setStep] = useState<Step>('confirm');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [siteResults, setSiteResults] = useState<SiteResult[]>([]);
  const resultsHeadingId = useId();

  const title = capitalize(recordType);
  const currentSite = localStorage.getItem('selectedSite') || '';
  const otherSites = availableSites.filter((site) => site !== currentSite);

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    setError(null);
    try {
      await onDelete();
      setDeleted(true);
      if (otherSites.length > 0) {
        setStep('send');
      }
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteOnSelectedSites = async () => {
    if (selectedSites.length === 0 || isSending) return;

    setIsSending(true);
    setSiteResults([]);

    const results = await Promise.all(
      selectedSites.map(async (site): Promise<SiteResult> => {
        try {
          await onDeleteOnSite(site);
          return { site, success: true };
        } catch (reason) {
          return { site, success: false, error: errorMessage(reason) };
        }
      })
    );

    setSiteResults(results);
    setIsSending(false);

    const successfulSites = results.filter((result) => result.success).map((result) => result.site);
    const failedSites = results.filter((result) => !result.success).map((result) => result.site);

    if (successfulSites.length > 0) {
      toast.success(`${title} deleted on: ${successfulSites.join(', ')}`);
    }

    if (failedSites.length > 0) {
      toast.error(`Failed to delete ${recordType} on: ${failedSites.join(', ')}`);
    }
  };

  const deletedAlert = (
    <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
      <Check className="h-4 w-4" />
      <AlertDescription>
        {title} deleted successfully on {currentSite}.
      </AlertDescription>
    </Alert>
  );

  const renderConfirmStep = () => (
    <>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {deleted && deletedAlert}

      <DialogFooter>
        <Button variant="outline" type="button" onClick={onClose} disabled={isDeleting}>
          {deleted ? 'Close' : 'Cancel'}
        </Button>
        {!deleted && (
          <Button variant="destructive" type="button" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        )}
      </DialogFooter>
    </>
  );

  const renderSendStep = () => (
    <>
      <div className="mb-6">
        {deletedAlert}

        <h3 className="text-base font-medium mb-2">Delete on Other Sites</h3>
        <p className="text-sm text-muted-foreground mb-4">Choose additional sites to delete this {recordType} on:</p>

        <div className="bg-muted/30 p-4 rounded-lg">
          <SiteSelection selectedSites={selectedSites} setSelectedSites={setSelectedSites} />
        </div>

        {siteResults.length > 0 && (
          <div className="mt-4">
            <h4 id={resultsHeadingId} className="text-sm font-medium mb-2">
              Results
            </h4>
            <ul aria-labelledby={resultsHeadingId} className="space-y-2">
              {siteResults.map((result) => (
                <li key={result.site} aria-label={result.site} className="flex items-center justify-between p-2 bg-background rounded border">
                  <span className="text-sm font-medium">{result.site}:</span>
                  {result.success ? (
                    <span className="text-sm text-green-600 font-medium">Success</span>
                  ) : (
                    <span className="text-sm text-red-600">Error - {result.error}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <DialogFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSending}>
          Close
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDeleteOnSelectedSites}
          disabled={selectedSites.length === 0 || isSending}
          className="min-w-[150px]"
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            'Delete on Selected Sites'
          )}
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        // Closing mid-request would hide the outcome the operator is waiting for.
        if (!open && !isDeleting && !isSending) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{step === 'confirm' ? `Delete ${title}` : `Delete ${title} on Other Sites`}</DialogTitle>
          <DialogDescription>
            {step === 'confirm' ? (
              <>
                This permanently deletes the {recordType} <span className="font-medium text-foreground">{recordName}</span>. It can't be undone.
              </>
            ) : (
              `Select the sites you want to delete ${recordType} ${recordName} on.`
            )}
          </DialogDescription>
        </DialogHeader>

        {step === 'confirm' ? renderConfirmStep() : renderSendStep()}
      </DialogContent>
    </Dialog>
  );
};
