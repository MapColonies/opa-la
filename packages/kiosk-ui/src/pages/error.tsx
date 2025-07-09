import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout';

interface ErrorPageProps {
  title?: string;
  message?: string;
  code?: string;
  onRetry?: () => void;
  showReload?: boolean;
}

export function ErrorPage({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  code,
  onRetry,
  showReload = true,
}: ErrorPageProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {code && <div className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">Error {code}</div>}
            <p className="text-muted-foreground leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="space-y-2">
          {showReload && (
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          <Button variant="outline" onClick={() => window.history.back()} className="w-full">
            Go Back
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">If this problem persists, please contact support.</div>
      </div>
    </Layout>
  );
}
