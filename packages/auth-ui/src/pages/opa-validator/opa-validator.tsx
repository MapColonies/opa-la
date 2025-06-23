import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent } from '../../components/ui/card';
import { toast } from 'sonner';
import { useConfig } from '../../contexts/ConfigProvider';
import { Code, Copy, AlertCircle, Loader2 } from 'lucide-react';
import { JSONEditor } from '../../components/json-editor';
import { SiteConfig } from '../../types/config';
import { JsonTreeViewer } from '../../components/internal/json-tree-viewer';
import { siteApis } from '../../fetch';
import { components } from '../../types/schema';

type Domain = components['schemas']['domain'];

const defaultJSONCode = `{
  
}`;

type OPAValidationForm = {
  site: string;
  env: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  domain: string;
  headers: string;
  queryParams: string;
  opaPath: string;
};

const METHODS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
];

const validateOPAPath = (path: string) => {
  if (path.startsWith('/') || path.endsWith('/')) {
    return 'Path cannot start or end with a slash';
  }
  const validPathRegex = /^[a-zA-Z0-9\-_/]+$/;
  if (!validPathRegex.test(path)) {
    return 'Path can only contain letters, numbers, hyphens, and underscores';
  }
  return true;
};

export function OPAValidatorPage() {
  const [validationResult, setValidationResult] = useState<any>(null);
  const [pathError, setPathError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, watch, setValue } = useForm<OPAValidationForm>({
    defaultValues: {
      queryParams: defaultJSONCode,
      headers: defaultJSONCode,
      opaPath: 'http/authz',
    },
  });
  const { config } = useConfig();

  const site = watch('site');
  const env = watch('env');
  const method = watch('method');
  const domain = watch('domain');
  const headers = watch('headers');
  const queryParams = watch('queryParams');
  const opaPath = watch('opaPath');

  const siteQueries = Object.keys(siteApis || {}).reduce(
    (acc, siteKey) => {
      const query = siteApis?.[siteKey]?.useQuery('get', '/domain', {
        enabled: siteKey === site,
      });

      if (query) {
        acc[siteKey] = query;
      }

      return acc;
    },
    {} as Record<string, ReturnType<(typeof siteApis)[string]['useQuery']>>
  );

  const currentSiteQuery = site ? siteQueries[site] : null;
  const domains = currentSiteQuery?.data?.items;
  const isLoadingDomains = currentSiteQuery?.isLoading ?? false;

  useEffect(() => {
    if (site) {
      setValue('domain', '');
    }
  }, [site, setValue]);

  useEffect(() => {
    if (!site || !config) return;

    const siteConfig = config[site] as SiteConfig;
    if (!siteConfig?.envs || siteConfig.envs.length === 0) return;

    const firstEnv = siteConfig.envs[0]!.envKey;
    setValue('env', firstEnv);
  }, [site, config, setValue]);

  const buildOPAUrl = (site: string, env: string) => {
    if (!config || !site || !env) return '';
    const siteConfig = config[site];
    if (!siteConfig) return '';

    const envConfig = siteConfig.envs?.find((e) => e.envKey === env);
    if (!envConfig) return '';

    return `${envConfig.opaUrl}/v1/data`;
  };

  const buildRequestBody = () => {
    try {
      const parsedHeaders = headers ? JSON.parse(headers) : {};
      const parsedQueryParams = queryParams ? JSON.parse(queryParams) : {};

      return {
        input: {
          query: parsedQueryParams,
          headers: parsedHeaders,
          method: method || 'GET',
          domain: domain || '',
        },
      };
    } catch (error) {
      return {
        input: {
          query: {},
          headers: {},
          method: 'GET',
          domain: '',
        },
      };
    }
  };

  const onSubmit = async (data: OPAValidationForm) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${buildOPAUrl(data.site, data.env)}/${data.opaPath}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildRequestBody(), null, 2),
      });

      const result = await response.json();
      setValidationResult(result);
      toast.success('Validation completed successfully');
    } catch (error) {
      toast.error('Failed to validate request');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const availableSites = config ? Object.keys(config) : [];
  const availableEnvs = (site && config?.[site]?.envs) || [];

  const copyToClipboard = (data: any) => {
    const formattedJson = JSON.stringify(data, null, 2);
    navigator.clipboard
      .writeText(formattedJson)
      .then(() => {
        toast.success('Response copied to clipboard');
      })
      .catch(() => {
        toast.error('Failed to copy to clipboard');
      });
  };

  const adjustInputWidth = () => {
    if (!inputRef.current) return;

    const input = inputRef.current;
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.whiteSpace = 'pre';
    tempSpan.style.font = window.getComputedStyle(input).font;
    tempSpan.textContent = input.value || input.placeholder;

    document.body.appendChild(tempSpan);
    const width = tempSpan.getBoundingClientRect().width;
    document.body.removeChild(tempSpan);

    input.style.width = `${Math.max(100, width + 20)}px`;
  };

  useEffect(() => {
    adjustInputWidth();
  }, [opaPath, env, site]);

  return (
    <div className="flex flex-wrap h-full">
      <div className={`p-6 overflow-auto ${validationResult ? 'w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r' : 'w-full'}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">OPA Request Validator</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="site">Site</Label>
                  <Select
                    value={site}
                    onValueChange={(value) => {
                      setValue('site', value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSites.map((siteName) => (
                        <SelectItem key={siteName} value={siteName}>
                          {config?.[siteName]?.name || siteName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="env">Environment</Label>
                  <Select value={env} onValueChange={(value) => setValue('env', value)} disabled={!site}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEnvs.map((env) => (
                        <SelectItem key={env.envKey} value={env.envKey}>
                          {env.envKey.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {site && env && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">OPA Endpoint:</p>
                  <div className="flex flex-wrap items-center gap-1 font-mono text-sm">
                    <span className="break-all">{buildOPAUrl(site, env)}/</span>
                    <div className="flex flex-col min-w-[100px]">
                      <Input
                        {...register('opaPath', {
                          validate: validateOPAPath,
                          onChange: (e) => {
                            const value = e.target.value;
                            setValue('opaPath', value);
                            adjustInputWidth();

                            const result = validateOPAPath(value);
                            if (result !== true) {
                              setPathError(result);
                            } else {
                              setPathError(null);
                            }
                          },
                        })}
                        ref={(e) => {
                          const { ref } = register('opaPath');
                          if (typeof ref === 'function') {
                            ref(e);
                          }
                          inputRef.current = e;
                        }}
                        className="h-8 px-2 py-1 text-sm bg-background min-w-[100px]"
                      />
                    </div>
                    <span>/decision</span>
                  </div>
                  {pathError && (
                    <div className="flex items-center gap-1 mt-2 text-destructive text-xs">
                      <AlertCircle className="h-3 w-3" />
                      <span>{pathError}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Request Body</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-mono text-sm">
                    <div className="flex">
                      <span className="text-blue-500">{'{'}</span>
                    </div>
                    <div className="ml-4">
                      <div className="flex">
                        <span className="text-purple-500">"input"</span>
                        <span className="text-blue-500">: {'{'}</span>
                      </div>
                      <div className="ml-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-500">"method"</span>
                          <span className="text-blue-500">:</span>
                          <div className="flex-1">
                            <Select onValueChange={(value) => setValue('method', value as OPAValidationForm['method'])}>
                              <SelectTrigger className="bg-white border border-gray-300 rounded-md h-8 focus-visible:ring-2 focus-visible:ring-primary/50 transition-shadow">
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                              <SelectContent>
                                {METHODS.map((method) => (
                                  <SelectItem key={method.value} value={method.value}>
                                    {method.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-purple-500">"domain"</span>
                          <span className="text-blue-500">:</span>
                          <div className="flex-1">
                            <Select value={domain} onValueChange={(value) => setValue('domain', value)} disabled={isLoadingDomains || !site}>
                              <SelectTrigger className="bg-white border border-gray-300 rounded-md h-8 focus-visible:ring-2 focus-visible:ring-primary/50 transition-shadow">
                                <SelectValue placeholder={isLoadingDomains ? 'Loading domains...' : 'Select domain'} />
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
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-purple-500">"query"</span>
                          <span className="text-blue-500">:</span>
                          <div className="flex-1 min-w-0">
                            <JSONEditor
                              value={queryParams || defaultJSONCode}
                              onChange={(value) => setValue('queryParams', value)}
                              placeholder='{"token": "..."}'
                              minHeight="60px"
                            />
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-purple-500">"headers"</span>
                          <span className="text-blue-500">:</span>
                          <div className="flex-1 min-w-0">
                            <JSONEditor
                              value={headers || defaultJSONCode}
                              onChange={(value) => setValue('headers', value)}
                              placeholder='{"Authorization": "Bearer ..."}'
                              minHeight="60px"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex">
                        <span className="text-blue-500">{'}'}</span>
                      </div>
                    </div>
                    <div className="flex">
                      <span className="text-blue-500">{'}'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={!site || !env || !!pathError || isLoading} className="relative">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin absolute left-4" />}
                <span className={isLoading ? 'ml-6' : ''}>Validate Request</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {validationResult && (
        <div className="w-full lg:w-1/2 p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Validation Result</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(validationResult)}
              className="flex items-center gap-1"
              disabled={isLoading}
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
          <div className="flex-1 overflow-hidden border rounded-md">
            <div className="h-full overflow-auto">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <JsonTreeViewer initialTheme="light" data={validationResult} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
