import { useState, useEffect } from 'react';
import { components } from '../../types/schema';
import { Button } from '../../components/ui/button';
import { Loader2, AlertCircle, Check, ArrowRight } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { SiteSelection, availableSites } from '../../components/SiteSelection';

type Domain = components['schemas']['domain'];

interface CreateDomainModalProps {
  onClose: () => void;
  onCreateDomain: (data: { body: Domain }) => void;
  onSendToOtherSites?: (data: { body: Domain; sites: string[] }) => void;
  isPending: boolean;
  isOtherSitesPending?: boolean;
  error?: string | null;
  success?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type Step = 'create' | 'send';

const formSchema = z.object({
  name: z.string().min(1, 'Domain name is required'),
});

type FormValues = z.infer<typeof formSchema>;

export const CreateDomainModal = ({ 
  onClose, 
  onCreateDomain, 
  onSendToOtherSites,
  isPending, 
  isOtherSitesPending = false,
  error,
  success = false,
  onOpenChange
}: CreateDomainModalProps) => {
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
    },
    mode: 'onChange',
  });

  const onSubmit = (data: FormValues) => {
    if (isPending || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      onCreateDomain({
        body: data as Domain,
      });
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('An unknown error occurred while creating the domain');
      }
      setIsSubmitting(false);
    }
  };

  const handleSendToOtherSites = () => {
    if (selectedSites.length === 0 || !onSendToOtherSites) {
      return;
    }

    onSendToOtherSites({
      body: form.getValues() as Domain,
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
          <AlertDescription>Domain created successfully on {currentSite}.</AlertDescription>
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
                  <Input 
                    placeholder="Domain name" 
                    {...field} 
                    disabled={success}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <DialogFooter>
            <p className="text-sm text-muted-foreground mr-auto">
              You'll be able to send this domain to other sites after creation.
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
                  'Create Domain'
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
          <AlertDescription>Domain created successfully on {currentSite}.</AlertDescription>
        </Alert>
        
        <h3 className="text-base font-medium mb-2">Send to Other Sites</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose additional sites to send this domain to:
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
      return 'Create New Domain';
    } else {
      return 'Send Domain to Other Sites';
    }
  };

  const getDialogDescription = () => {
    if (currentStep === 'create') {
      return 'Enter the domain name to create a new domain.';
    } else {
      return 'Select the sites you want to send this domain to.';
    }
  };

  return (
    <DialogContent 
      className="sm:max-w-[600px]"
      onInteractOutside={(e) => {
        if (currentStep === 'send' && isOtherSitesPending) {
          e.preventDefault();
        } else {
          e.preventDefault();
          onOpenChange?.(false);
        }
      }}
      onEscapeKeyDown={(e) => {
        if (currentStep === 'send' && isOtherSitesPending) {
          e.preventDefault();
        } else {
          onOpenChange?.(false);
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
