import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { $api } from '@/lib/http-client';
import { Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/layout';

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
    <Layout>
      <div className="w-full flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-8 text-center">Token Management</h1>
        <Card className="w-full max-w-xl mx-auto p-0">
          <CardContent className="py-8 px-6 flex flex-col gap-6 items-center">
            {(!tokenData || isFetching) && (
              <Button onClick={fetchToken} disabled={isFetching} size="lg" className="w-full">
                {isFetching ? 'Fetching Token...' : 'Fetch Token'}
              </Button>
            )}
            {isFetching && (
              <div className="w-full flex flex-col items-center gap-2">
                <Progress value={progress} className="w-full" />
                <span className="text-muted-foreground text-xs">Generating token, please wait...</span>
              </div>
            )}
            {isError && <div className="text-destructive">{error instanceof Error ? error.message : 'Failed to fetch token'}</div>}
            {tokenData && !isFetching && (
              <div className="w-full flex flex-col gap-4 items-center">
                <div className="text-green-700 font-semibold text-lg">Token generated successfully</div>
                <div className="font-mono text-base break-all select-all bg-background rounded p-3 border w-full text-center">{tokenData.token}</div>
                <div className="text-lg font-bold text-primary">Expires at:</div>
                <div className="text-lg font-semibold text-muted-foreground mb-2">{new Date(tokenData.expiration).toLocaleString()}</div>
                <div className="flex gap-3">
                  <Button size="sm" variant="outline" onClick={handleCopy} className="flex items-center gap-2">
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy Token'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={fetchToken}>
                    Request Token Again
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
