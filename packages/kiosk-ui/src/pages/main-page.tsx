import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { $api } from '@/lib/http-client';
import { Check, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export function MainPage() {
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  // Use React Query for token fetching
  const { data: tokenData, isError, error, refetch, isFetching } = $api.useQuery('get', '/token', undefined, { enabled: false });

  // Simulate progress bar for UX when fetching
  useEffect(() => {
    let active = true;
    if (isFetching) {
      setProgress(0);
      (async () => {
        for (let i = 1; i <= 10; i++) {
          await new Promise((res) => setTimeout(res, 50));
          if (!active) return;
          setProgress(i * 10);
        }
      })();
    } else {
      setProgress(0);
    }
    return () => {
      active = false;
    };
  }, [isFetching]);

  const fetchToken = () => {
    refetch();
  };

  const handleCopy = () => {
    if (tokenData) {
      navigator.clipboard.writeText(tokenData.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="h-8" />
      <Card className="w-full max-w-xl mx-auto p-0">
        <CardContent className="py-8 px-6 flex flex-col gap-8 items-center min-h-[320px] justify-center">
          {(!tokenData || isFetching) && (
            <div className="w-full flex flex-col items-center justify-center min-h-[180px]">
              <Button onClick={fetchToken} disabled={isFetching} size="lg" className="w-full">
                {isFetching ? 'Fetching Token...' : 'Fetch Token'}
              </Button>
            </div>
          )}
          {isFetching && (
            <div className="w-full flex flex-col items-center gap-2">
              <Progress value={progress} className="w-full" />
              <span className="text-muted-foreground text-xs">Generating token, please wait...</span>
            </div>
          )}
          {isError && (
            <Alert variant="destructive" className="w-full">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error instanceof Error ? error.message : 'Failed to fetch token'}</AlertDescription>
            </Alert>
          )}
          {tokenData && !isFetching && (
            <Alert variant="default" className="w-full flex flex-col gap-6 items-center">
              <AlertTitle>
                <span className="text-green-700 font-semibold text-lg">Token generated successfully</span>
              </AlertTitle>
              <div className="w-full overflow-x-auto">
                <Badge
                  variant="outline"
                  className="font-mono text-base break-all select-all bg-background rounded p-3 border w-full min-w-[300px] max-w-full text-center whitespace-pre-wrap"
                  style={{ wordBreak: 'break-all' }}
                >
                  {tokenData.token}
                </Badge>
              </div>
              <div className="text-lg font-bold text-primary mt-2">Expires at:</div>
              <div className="text-lg font-semibold text-muted-foreground mb-2">{format(new Date(tokenData.expiration), 'dd/MM/yyyy HH:mm')}</div>
              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                <Button size="sm" variant="outline" onClick={handleCopy} className="flex items-center gap-2 w-full sm:w-auto">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copy Token
                </Button>
                <Button size="sm" variant="secondary" onClick={fetchToken} className="transition-colors duration-100 w-full sm:w-auto">
                  Request Token Again
                </Button>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
