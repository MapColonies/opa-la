import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <Card className="w-full max-w-xl mx-auto border rounded-xl shadow-sm bg-card">
      <CardContent className="p-6">
        <div className="min-h-[420px] flex flex-col">
          {/* Header Section */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">{t('token.generation.title')}</h2>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col justify-center">
            {(!tokenData || isLoading) && !isError && (
              <div className="flex flex-col items-center gap-4">
                <Button onClick={onFetchToken} disabled={isLoading} size="lg" className="w-full max-w-sm h-12 text-base font-medium">
                  {isLoading ? t('token.generation.buttonLoading') : t('token.generation.button')}
                </Button>
                {!isLoading && <p className="text-xs text-muted-foreground text-center">{t('token.generation.description')}</p>}
              </div>
            )}

            {isLoading && (
              <div className="mt-4">
                <LoadingProgress progress={progress} />
              </div>
            )}

            {isError && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <AlertTitle className="text-red-800 dark:text-red-200">{t('token.error.title')}</AlertTitle>
                <AlertDescription className="text-red-700 dark:text-red-300">
                  {error instanceof Error ? error.message : t('token.error.description')}
                </AlertDescription>
              </Alert>
            )}

            {tokenData && !isLoading && <TokenDisplay tokenData={tokenData} copied={copied} onCopy={onCopy} onRequestAgain={onFetchToken} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
