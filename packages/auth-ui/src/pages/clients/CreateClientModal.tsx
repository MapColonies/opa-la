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
import { SiteSelection, availableSites } from '../../components/SiteSelection';

type Client = components['schemas']['client'];

interface CreateClientModalProps {
  onClose: () => void;
  onCreateClient: (data: { body: Client }) => void;
  onSendToOtherSites?: (data: { body: Client; sites: string[] }) => void;
  isPending: boolean;
  isOtherSitesPending?: boolean;
  error?: string | null;
  success?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type Step = 'create' | 'send';

const isHebrewText = (text: string): boolean => {
  return /^[\u0590-\u05FF0-9\s]+$/.test(text);
};

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  hebName: z.string().min(1, 'Hebrew Name is required').refine(isHebrewText, {
    message: 'Hebrew Name must contain only Hebrew characters and numbers',
  }),
  description: z.string().optional(),
  branch: z.string().optional(),
  tags: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

export const CreateClientModal = ({ 
  onClose, 
  onCreateClient, 
  onSendToOtherSites,
  isPending, 
  isOtherSitesPending = false,
  error,
  success = false
}: CreateClientModalProps) => {
  const [newTag, setNewTag] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>('create');
  const currentSite = localStorage.getItem('selectedSite') || '';
  
  const otherSites = availableSites.filter(site => site !== currentSite);

  useEffect(() => {
    if (success && currentStep === 'create' && otherSites.length > 0) {
      setCurrentStep('send');
    }
  }, [success, currentStep, otherSites.length]);

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
    },
  });

  const handleAddNewTag = () => {
    if (newTag.trim() && !form.getValues('tags').includes(newTag.trim())) {
      const currentTags = form.getValues('tags');
      form.setValue('tags', [...currentTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveNewTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter((tag) => tag !== tagToRemove));
  };

  const onSubmit = (data: FormValues) => {
    if (isPending || isSubmitting) return;
    
    try {
      setIsSubmitting(true); 
      onCreateClient({
        body: data as Client,
      });
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('An unknown error occurred while creating the client');
      }
      setIsSubmitting(false);
    }
  };

  const handleSendToOtherSites = () => {
    if (selectedSites.length === 0 || !onSendToOtherSites) {
      return;
    }

    onSendToOtherSites({
      body: form.getValues() as Client,
      sites: selectedSites
    });
  };

  const renderCreateStep = () => (
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
          <AlertDescription>Client created successfully on {currentSite}.</AlertDescription>
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
                  <Input placeholder="Client name" {...field} disabled={success} />
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
            name="tags"
            render={() => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewTag();
                          }
                        }}
                        placeholder="Add a tag"
                        disabled={success}
                      />
                      <Button type="button" variant="outline" onClick={handleAddNewTag} disabled={success}>
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
                            onClick={() => handleRemoveNewTag(tag)}
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
            <p className="text-sm text-muted-foreground mr-auto">
              You'll be able to send this client to other sites after creation.
            </p>
            <Button variant="outline" type="button" onClick={onClose}>
              {success && otherSites.length === 0 ? 'Close' : 'Cancel'}
            </Button>
            {!success && (
              <Button type="submit" disabled={isPending || isSubmitting}>
                {isPending || isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Client'
                )}
              </Button>
            )}
            {success && otherSites.length > 0 && (
              <Button 
                type="button" 
                onClick={() => setCurrentStep('send')}
                className="gap-2"
              >
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
          <AlertDescription>Client created successfully on {currentSite}.</AlertDescription>
        </Alert>
        
        <h3 className="text-base font-medium mb-2">Send to Other Sites</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose additional sites to send this client to:
        </p>
        
        <div className="bg-muted/30 p-4 rounded-lg">
          <SiteSelection 
            selectedSites={selectedSites} 
            setSelectedSites={setSelectedSites} 
          />
        </div>
      </div>

      <DialogFooter className="flex justify-between">
        <Button 
          type="button" 
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
        <Button 
          type="button" 
          onClick={handleSendToOtherSites} 
          disabled={selectedSites.length === 0 || isOtherSitesPending}
          className="min-w-[150px]"
        >
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
    if (currentStep === 'create') {
      return 'Create New Client';
    } else {
      return 'Send Client to Other Sites';
    }
  };

  const getDialogDescription = () => {
    if (currentStep === 'create') {
      return 'Fill in the details to create a new client.';
    } else {
      return 'Select the sites you want to send this client to.';
    }
  };

  return (
    <DialogContent 
      className="sm:max-w-[600px]"
      onInteractOutside={(e) => {
        e.preventDefault();
      }}
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
      
      {currentStep === 'create' ? renderCreateStep() : renderSendStep()}
    </DialogContent>
  );
};
