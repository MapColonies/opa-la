import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { LoadingProgress } from './loading-progress';
import { TokenDisplay } from './token-display';

interface TokenData {
  token: string;
  expiration: string;
}

interface TokenCardProps {
  tokenData?: TokenData;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  progress: number;
  copied: boolean;
  onFetchToken: () => void;
  onCopy: () => void;
}

export function TokenCard({ tokenData, isLoading, isError, error, progress, copied, onFetchToken, onCopy }: TokenCardProps) {
  return (
    <Card className="w-full max-w-xl mx-auto p-0">
      <CardContent className="py-8 px-6 flex flex-col gap-8 items-center min-h-[320px] justify-center">
        {(!tokenData || isLoading) && (
          <div className="w-full flex flex-col items-center justify-center min-h-[180px]">
            <Button onClick={onFetchToken} disabled={isLoading} size="lg" className="w-full">
              {isLoading ? 'Fetching Token...' : 'Fetch Token'}
            </Button>
          </div>
        )}

        {isLoading && <LoadingProgress progress={progress} />}

        {isError && (
          <Alert variant="destructive" className="w-full">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error instanceof Error ? error.message : 'Failed to fetch token'}</AlertDescription>
          </Alert>
        )}

        {tokenData && !isLoading && <TokenDisplay tokenData={tokenData} copied={copied} onCopy={onCopy} onRequestAgain={onFetchToken} />}
      </CardContent>
    </Card>
  );
}
