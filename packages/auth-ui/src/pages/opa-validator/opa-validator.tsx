import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent } from '../../components/ui/card';
import { toast } from 'sonner';
import { useConfig } from '../../contexts/ConfigProvider';
import { Code, Copy } from 'lucide-react';
import { JSONEditor } from '../../components/json-editor';
import { SiteConfig } from '../../types/config';
import { JsonTreeViewer } from '../../components/internal/json-tree-viewer';

const defaultJSONCode = `{
  
}`;

type OPAValidationForm = {
  site: string;
  env: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  domain: string;
  headers: string;
  queryParams: string;
};

const METHODS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
];

export function OPAValidatorPage() {
  const [validationResult, setValidationResult] = useState<any>(null);
  const { register, handleSubmit, watch, setValue } = useForm<OPAValidationForm>({
    defaultValues: {
      queryParams: defaultJSONCode,
      headers: defaultJSONCode,
    },
  });
  const { config } = useConfig();

  const site = watch('site');
  const env = watch('env');
  const method = watch('method');
  const domain = watch('domain');
  const headers = watch('headers');
  const queryParams = watch('queryParams');

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

    return `${envConfig.opalaUrl}/v1/data/http/authz/decision`;
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
      const response = await fetch(buildOPAUrl(data.site, data.env), {
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

  return (
    <div className="flex flex-col h-full p-6">
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
                <p className="text-sm text-muted-foreground">OPA Endpoint:</p>
                <code className="text-sm break-all">{buildOPAUrl(site, env)}</code>
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
                          <Input
                            placeholder="example.com"
                            {...register('domain')}
                            className="bg-white border border-gray-300 rounded-md h-8 px-2 focus-visible:ring-2 focus-visible:ring-primary/50 transition-shadow"
                          />
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
            <Button type="submit" disabled={!site || !env}>
              Validate Request
            </Button>
          </form>
          {validationResult && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Validation Result</h3>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(validationResult)} className="flex items-center gap-1">
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <div className="relative">
                <JsonTreeViewer initialTheme="light" data={validationResult} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
