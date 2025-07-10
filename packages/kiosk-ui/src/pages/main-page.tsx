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
  const [isCustomLoading, setIsCustomLoading] = useState(false);

  // Use React Query for token fetching
  const { data: tokenData, isError, error, refetch, isFetching } = $api.useQuery('get', '/token', undefined, { enabled: false });

  // Use custom loading state that includes our artificial delay
  const isLoading = isCustomLoading || isFetching;

  // Simulate progress bar for UX when fetching
  useEffect(() => {
    let active = true;
    let timeoutId: NodeJS.Timeout;

    if (isLoading) {
      setProgress(0);
      (async () => {
        // Simulate a more realistic loading experience
        const steps = 20; // More granular progress
        const minDuration = 1500; // Minimum 1.5 seconds for better UX
        const stepDuration = minDuration / steps;

        for (let i = 1; i <= steps; i++) {
          if (!active) return;

          // Use exponential easing for more natural progress
          const easedProgress = Math.min(95, Math.pow(i / steps, 0.7) * 95);
          setProgress(easedProgress);

          await new Promise((res) => {
            timeoutId = setTimeout(res, stepDuration);
          });
        }

        // Complete the progress bar when done
        if (active) {
          setProgress(100);
        }
      })();
    } else {
      // Reset progress when not fetching
      setProgress(0);
    }

    return () => {
      active = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading]);

  const fetchToken = async () => {
    setIsCustomLoading(true);

    try {
      // Start the minimum delay timer
      const minDelay = 1500; // 1.5 seconds minimum
      const startTime = Date.now();

      // Start the API call
      await refetch();

      // Calculate remaining delay needed
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, minDelay - elapsed);

      // Wait for the remaining delay if needed
      if (remainingDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingDelay));
      }
    } finally {
      setIsCustomLoading(false);
    }
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
          {(!tokenData || isLoading) && (
            <div className="w-full flex flex-col items-center justify-center min-h-[180px]">
              <Button onClick={fetchToken} disabled={isLoading} size="lg" className="w-full">
                {isLoading ? 'Fetching Token...' : 'Fetch Token'}
              </Button>
            </div>
          )}
          {isLoading && (
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
          {tokenData && !isLoading && (
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
