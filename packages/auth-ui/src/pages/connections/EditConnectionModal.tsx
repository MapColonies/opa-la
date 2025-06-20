import { useState, useEffect } from 'react';
import { components } from '../../types/schema';
import { Button } from '../../components/ui/button';
import { Loader2, X, HelpCircle, Check, ArrowRight, AlertCircle } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { $api } from '../../fetch';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { SiteSelection, availableSites } from '../../components/SiteSelection';
import { isEqual } from 'lodash';
type Connection = components['schemas']['connection'];
type Domain = components['schemas']['domain'];

type SiteResult = {
  site: string;
  success: boolean;
  error?: string;
};

interface EditConnectionModalProps {
  connection: Connection | null;
  onClose: () => void;
  onUpdateConnection: (data: { body: Connection }) => void;
  onSendToOtherSites?: (data: { body: Connection; sites: string[] }) => void;
  isPending: boolean;
  isOtherSitesPending?: boolean;
  error?: string | null;
  success?: boolean;
  siteResults?: SiteResult[];
  onOpenChange?: (open: boolean) => void;
}

type Step = 'edit' | 'send';

const formSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  environment: z.string().min(1, 'Environment is required'),
  version: z.number().int().positive(),
  enabled: z.boolean(),
  token: z.string().optional(),
  domains: z.array(z.string()).min(1, 'At least one domain is required'),
  allowNoBrowserConnection: z.boolean(),
  allowNoOriginConnection: z.boolean(),
  origins: z.array(z.string()),
  createdAt: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const EditConnectionModal = ({ 
  connection, 
  onClose, 
  onUpdateConnection,
  onSendToOtherSites,
  isPending, 
  isOtherSitesPending = false,
  error,
  success = false,
  siteResults = [],
}: EditConnectionModalProps) => {
  const [newOrigin, setNewOrigin] = useState('');
  const [useToken, setUseToken] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>('edit');
  const [originalValues, setOriginalValues] = useState<FormValues | null>(null);
  const [formChanged, setFormChanged] = useState(false);
  const [lastSubmittedData, setLastSubmittedData] = useState<FormValues | null>(null);
  const currentSite = localStorage.getItem('selectedSite') || '';
  
  const otherSites = availableSites.filter(site => site !== currentSite);

  const { data: domains, isLoading: isLoadingDomains } = $api.useQuery('get', '/domain');

  useEffect(() => {
    if (success && currentStep === 'edit' && otherSites.length > 0) {
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
      environment: 'np',
      version: 1,
      enabled: true,
      token: '',
      domains: [],
      allowNoBrowserConnection: false,
      allowNoOriginConnection: false,
      origins: [],
      createdAt: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (connection) {
      const initialValues = {
        name: connection.name,
        environment: connection.environment,
        version: connection.version,
        enabled: connection.enabled,
        token: connection.token || '',
        domains: connection.domains || [],
        allowNoBrowserConnection: connection.allowNoBrowserConnection,
        allowNoOriginConnection: connection.allowNoOriginConnection,
        origins: connection.origins || [],
        createdAt: connection.createdAt
      };
      
      setOriginalValues(initialValues);
      form.reset(initialValues);
      setUseToken(!!connection.token);
      
      if (!error && !isPending) {
        setFormError(null);
      }
    }
  }, [connection, form, error, isPending]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (originalValues) {
        const currentValues = value as FormValues;
        const hasChanges = !isEqual({
          environment: currentValues.environment,
          enabled: currentValues.enabled,
          token: useToken ? currentValues.token : '',
          domains: currentValues.domains,
          allowNoBrowserConnection: currentValues.allowNoBrowserConnection,
          allowNoOriginConnection: currentValues.allowNoOriginConnection,
          origins: currentValues.origins
        }, {
          environment: originalValues.environment,
          enabled: originalValues.enabled,
          token: useToken ? originalValues.token : '',
          domains: originalValues.domains,
          allowNoBrowserConnection: originalValues.allowNoBrowserConnection,
          allowNoOriginConnection: originalValues.allowNoOriginConnection,
          origins: originalValues.origins
        });
        
        setFormChanged(hasChanges);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, originalValues, useToken]);

  const handleAddOrigin = () => {
    if (newOrigin.trim() && !form.getValues('origins').includes(newOrigin.trim())) {
      const currentOrigins = form.getValues('origins');
      form.setValue('origins', [...currentOrigins, newOrigin.trim()], { shouldDirty: true, shouldValidate: true });
      setNewOrigin('');
    }
  };

  const handleRemoveOrigin = (originToRemove: string) => {
    const currentOrigins = form.getValues('origins');
    form.setValue('origins', currentOrigins.filter((origin) => origin !== originToRemove), { shouldDirty: true, shouldValidate: true });
  };
  
  const handleDomainSelect = (domainName: string) => {
    if (domainName && !form.getValues('domains').includes(domainName)) {
      const currentDomains = form.getValues('domains');
      form.setValue('domains', [...currentDomains, domainName], { shouldDirty: true, shouldValidate: true });
    }
  };
  
  const handleRemoveDomain = (domainToRemove: string) => {
    const currentDomains = form.getValues('domains');
    form.setValue('domains', currentDomains.filter((domain) => domain !== domainToRemove), { shouldDirty: true, shouldValidate: true });
  };
  
  const handleTokenToggle = (checked: boolean) => {
    setUseToken(checked);
    if (!checked) {
      form.setValue('token', '', { shouldDirty: true, shouldValidate: true });
    } else if (connection?.token) {
      form.setValue('token', connection.token, { shouldDirty: true, shouldValidate: true });
    }
  };

  const onSubmit = (data: FormValues) => {
    if (isPending || isSubmitting || !formChanged) return;
    
    try {
      if (!data.allowNoOriginConnection && data.origins.length === 0) {
        setFormError('At least one origin is required when origin check is enabled');
        return;
      }
      
      const finalData = {
        ...data,
        token: useToken ? data.token : '',
      };
      
      const { createdAt, ...dataToSubmit } = finalData;
      
      setIsSubmitting(true);
      setLastSubmittedData(finalData);
      onUpdateConnection({
        body: dataToSubmit as Connection,
      });
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('An unknown error occurred while updating the connection');
      }
      setIsSubmitting(false);
    }
  };

  const handleSendToOtherSites = () => {
    if (selectedSites.length === 0 || !onSendToOtherSites) {
      return;
    }

    const dataToSend = lastSubmittedData || form.getValues();
    const { createdAt, ...dataToSubmit } = dataToSend;
    
    onSendToOtherSites({
      body: dataToSubmit as Connection,
      sites: selectedSites
    });
  };

  if (!connection) {
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
          <AlertDescription>Connection updated successfully on {currentSite}.</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <FormControl>
                  <Input {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="environment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Environment</FormLabel>
                <Select
                  disabled={success}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    <SelectItem value="np">Non-Production</SelectItem>
                    <SelectItem value="stage">Stage</SelectItem>
                    <SelectItem value="prod">Production</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Status</FormLabel>
                </div>
                <FormControl>
                  <Switch 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                    disabled={success}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label>Generate Token</Label>
            </div>
            <Switch 
              checked={!useToken} 
              onCheckedChange={(checked) => handleTokenToggle(!checked)}
              disabled={success}
            />
          </div>
          
          {useToken && (
            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      placeholder="Connection token"
                      disabled={success}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <FormField
            control={form.control}
            name="allowNoBrowserConnection"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Browser Check</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    {field.value ? 'Allow connections without browser validation' : 'Require browser validation'}
                  </p>
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
                <FormControl>
                  <Switch 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                    disabled={success}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="allowNoOriginConnection"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Origin Check</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    {field.value ? 'Allow connections without origin validation' : 'Require origin validation'}
                  </p>
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
                <FormControl>
                  <Switch 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                    disabled={success}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="domains"
            render={() => (
              <FormItem>
                <FormLabel>Domains</FormLabel>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Select 
                      value="" 
                      onValueChange={handleDomainSelect} 
                      disabled={isLoadingDomains || success}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a domain" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        {domains?.items?.map((domain: Domain) => (
                          <SelectItem key={domain.name} value={domain.name}>
                            {domain.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch('domains').map((domain) => (
                      <Badge key={domain} variant="secondary" className="flex items-center gap-1">
                        {domain}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => handleRemoveDomain(domain)}
                          disabled={success}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  {form.formState.errors.domains && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.domains.message}
                    </p>
                  )}
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="origins"
            render={() => (
              <FormItem>
                <FormLabel>Origins</FormLabel>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newOrigin}
                      onChange={(e) => setNewOrigin(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOrigin();
                        }
                      }}
                      placeholder="Add an origin"
                      disabled={success || (form.watch('allowNoOriginConnection'))}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleAddOrigin} 
                      disabled={success || (form.watch('allowNoOriginConnection'))}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch('origins').map((origin) => (
                      <Badge key={origin} variant="secondary" className="flex items-center gap-1">
                        {origin}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => handleRemoveOrigin(origin)}
                          disabled={success}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  {!form.watch('allowNoOriginConnection') && form.watch('origins').length === 0 && (
                    <p className="text-sm font-medium text-destructive">
                      At least one origin is required when origin check is enabled
                    </p>
                  )}
                </div>
              </FormItem>
            )}
          />
          
          <DialogFooter>
            <p className="text-sm text-muted-foreground mr-auto">
              You'll be able to send this connection to other sites after updating.
            </p>
            <Button variant="outline" type="button" onClick={onClose}>
              {success && otherSites.length === 0 ? 'Close' : 'Cancel'}
            </Button>
            {!success && (
              <Button 
                type="submit" 
                disabled={isPending || isSubmitting || !formChanged}
                className={formChanged ? "" : "opacity-50 cursor-not-allowed"}
              >
                {isPending || isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Connection'
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
          <AlertDescription>Connection updated successfully on {currentSite}.</AlertDescription>
        </Alert>
        
        <h3 className="text-base font-medium mb-2">Send to Other Sites</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose additional sites to send this connection to:
        </p>
        
        <div className="bg-muted/30 p-4 rounded-lg">
          <SiteSelection 
            selectedSites={selectedSites} 
            setSelectedSites={setSelectedSites} 
          />
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
    if (currentStep === 'edit') {
      return 'Edit Connection';
    } else {
      return 'Send Connection to Other Sites';
    }
  };

  const getDialogDescription = () => {
    if (currentStep === 'edit') {
      return 'Modify the connection details.';
    } else {
      return 'Select the sites you want to send this connection to.';
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
      
      {currentStep === 'edit' ? renderEditStep() : renderSendStep()}
    </DialogContent>
  );
};
