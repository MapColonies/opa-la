import { useState, useEffect } from 'react';
import { components } from '../../types/schema';
import { Button } from '../../components/ui/button';
import { Loader2, X, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { SiteSelection } from '../../components/SiteSelection';
import { isEqual } from 'lodash';
import { getAvailableSites } from '@/components/exports';

type Client = components['schemas']['client'];
type NamelessClient = components['schemas']['namelessClient'];

type SiteResult = {
  site: string;
  success: boolean;
  error?: string;
};

interface EditClientModalProps {
  client: Client | null;
  onClose: () => void;
  onUpdateClient: (data: { params: { path: { clientName: string } }; body: NamelessClient }) => void;
  onSendToOtherSites?: (data: { params: { path: { clientName: string } }; body: NamelessClient; sites: string[] }) => void;
  isPending: boolean;
  isOtherSitesPending?: boolean;
  error?: string | null;
  success?: boolean;
  siteResults?: SiteResult[];
  onOpenChange?: (open: boolean) => void;
  onStepChange?: (step: Step) => void;
}

type Step = 'edit' | 'send';

const isHebrewText = (text: string): boolean => {
  return /^[\u0590-\u05FF0-9\s]+$/.test(text);
};

const formSchema = z.object({
  name: z.string(),
  hebName: z.string().min(1, 'Hebrew Name is required').refine(isHebrewText, {
    message: 'Hebrew Name must contain only Hebrew characters and numbers',
  }),
  description: z.string().optional(),
  branch: z.string().optional(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const availableSites = getAvailableSites();

type FormValues = z.infer<typeof formSchema>;

export const EditClientModal = ({
  client,
  onClose,
  onUpdateClient,
  onSendToOtherSites,
  isPending,
  isOtherSitesPending = false,
  error,
  success = false,
  siteResults = [],
  onStepChange,
}: EditClientModalProps) => {
  const [editTag, setEditTag] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>('edit');
  const [originalValues, setOriginalValues] = useState<FormValues | null>(null);
  const [formChanged, setFormChanged] = useState(false);
  const [lastSubmittedData, setLastSubmittedData] = useState<FormValues | null>(null);
  const currentSite = localStorage.getItem('selectedSite') || '';

  const otherSites = availableSites.filter((site) => site !== currentSite);

  useEffect(() => {
    if (success && currentStep === 'edit' && otherSites.length > 0) {
      setCurrentStep('send');
    }
  }, [success, currentStep, otherSites.length]);

  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  useEffect(() => {
    if (error) {
      setFormError(error);
      setIsSubmitting(false);
    } else if (!isPending && isSubmitting) {
      setFormError(null);
      setIsSubmitting(false);
    }

    if (success) {
      setFormError(null);
    }
  }, [error, isPending, isSubmitting, success]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      hebName: '',
      description: '',
      branch: '',
      tags: [],
      createdAt: '',
      updatedAt: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (client) {
      const initialValues = {
        name: client.name,
        hebName: client.hebName,
        description: client.description || '',
        branch: client.branch || '',
        tags: client.tags || [],
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      };

      setOriginalValues(initialValues);
      form.reset(initialValues);

      if (!error && !isPending) {
        setFormError(null);
      }
    }
  }, [client, form, error, isPending]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (originalValues) {
        const currentValues = value as FormValues;
        const hasChanges = !isEqual(
          {
            hebName: currentValues.hebName,
            description: currentValues.description,
            branch: currentValues.branch,
            tags: currentValues.tags,
          },
          {
            hebName: originalValues.hebName,
            description: originalValues.description,
            branch: originalValues.branch,
            tags: originalValues.tags,
          }
        );

        setFormChanged(hasChanges);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, originalValues]);

  const handleAddEditTag = () => {
    if (editTag.trim() && !form.getValues('tags').includes(editTag.trim())) {
      const currentTags = form.getValues('tags');
      form.setValue('tags', [...currentTags, editTag.trim()], { shouldDirty: true });
      setEditTag('');
    }
  };

  const handleRemoveEditTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue(
      'tags',
      currentTags.filter((tag) => tag !== tagToRemove),
      { shouldDirty: true }
    );
  };

  const onSubmit = (data: FormValues) => {
    if (isPending || isSubmitting || !formChanged) return;

    try {
      setIsSubmitting(true);
      setLastSubmittedData(data);
      onUpdateClient({
        params: {
          path: {
            clientName: data.name,
          },
        },
        body: {
          hebName: data.hebName,
          description: data.description,
          branch: data.branch,
          tags: data.tags,
        } as NamelessClient,
      });
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('An unknown error occurred while updating the client');
      }
      setIsSubmitting(false);
    }
  };

  const handleSendToOtherSites = () => {
    if (selectedSites.length === 0 || !onSendToOtherSites || !client) {
      return;
    }

    const dataToSend = lastSubmittedData || form.getValues();

    onSendToOtherSites({
      params: {
        path: {
          clientName: dataToSend.name,
        },
      },
      body: {
        hebName: dataToSend.hebName,
        description: dataToSend.description,
        branch: dataToSend.branch,
        tags: dataToSend.tags,
      } as NamelessClient,
      sites: selectedSites,
    });
  };

  if (!client) {
    return null;
  }

  const renderEditStep = () => (
    <>
      {formError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
          <Check className="h-4 w-4" />
          <AlertDescription>Client updated successfully on {currentSite}.</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} disabled className="bg-muted" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hebName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hebrew Name</FormLabel>
                <FormControl>
                  <Input placeholder="Hebrew name" {...field} disabled={success} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Client description" {...field} disabled={success} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="branch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branch</FormLabel>
                <FormControl>
                  <Input placeholder="Branch name" {...field} disabled={success} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="createdAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Created At</FormLabel>
                <FormControl>
                  <Input {...field} disabled className="bg-muted" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="updatedAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Updated At</FormLabel>
                <FormControl>
                  <Input {...field} disabled className="bg-muted" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={() => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={editTag}
                        onChange={(e) => setEditTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddEditTag();
                          }
                        }}
                        placeholder="Add a tag"
                        disabled={success}
                      />
                      <Button type="button" variant="outline" onClick={handleAddEditTag} disabled={success}>
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.getValues('tags').map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => handleRemoveEditTag(tag)}
                            disabled={success}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <p className="text-sm text-muted-foreground mr-auto">You'll be able to send this client to other sites after updating.</p>
            <Button variant="outline" type="button" onClick={onClose}>
              {success && otherSites.length === 0 ? 'Close' : 'Cancel'}
            </Button>
            {!success && (
              <Button
                type="submit"
                disabled={isPending || isSubmitting || !formChanged}
                className={formChanged ? '' : 'opacity-50 cursor-not-allowed'}
              >
                {isPending || isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Client'
                )}
              </Button>
            )}
            {success && otherSites.length > 0 && (
              <Button type="button" onClick={() => setCurrentStep('send')} className="gap-2">
                Send to Other Sites
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </DialogFooter>
        </form>
      </Form>
    </>
  );

  const renderSendStep = () => (
    <>
      <div className="mb-6">
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
          <Check className="h-4 w-4" />
          <AlertDescription>Client updated successfully on {currentSite}.</AlertDescription>
        </Alert>

        <h3 className="text-base font-medium mb-2">Send to Other Sites</h3>
        <p className="text-sm text-muted-foreground mb-4">Choose additional sites to send this client to:</p>

        <div className="bg-muted/30 p-4 rounded-lg">
          <SiteSelection selectedSites={selectedSites} setSelectedSites={setSelectedSites} />
        </div>

        {siteResults.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Results:</h4>
            <div className="space-y-2">
              {siteResults.map((result) => (
                <div key={result.site} className="flex items-center justify-between p-2 bg-background rounded border">
                  <span className="text-sm font-medium">{result.site}:</span>
                  {result.success ? (
                    <span className="text-sm text-green-600 font-medium">Success</span>
                  ) : (
                    <span className="text-sm text-red-600">Error - {result.error}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DialogFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button type="button" onClick={handleSendToOtherSites} disabled={selectedSites.length === 0 || isOtherSitesPending} className="min-w-[150px]">
          {isOtherSitesPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send to Selected Sites'
          )}
        </Button>
      </DialogFooter>
    </>
  );

  const getDialogTitle = () => {
    if (currentStep === 'edit') {
      return 'Edit Client';
    } else {
      return 'Send Client to Other Sites';
    }
  };

  const getDialogDescription = () => {
    if (currentStep === 'edit') {
      return 'Update the client details.';
    } else {
      return 'Select the sites you want to send this client to.';
    }
  };

  return (
    <DialogContent
      className="sm:max-w-[600px]"
      onEscapeKeyDown={(e) => {
        if (currentStep === 'send' && isOtherSitesPending) {
          e.preventDefault();
        }
      }}
    >
      <DialogHeader>
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        <DialogDescription>{getDialogDescription()}</DialogDescription>
      </DialogHeader>

      {currentStep === 'edit' ? renderEditStep() : renderSendStep()}
    </DialogContent>
  );
};
