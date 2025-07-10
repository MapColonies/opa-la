import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  code?: string;
  onRetry?: () => void;
  showReload?: boolean;
}

export function ErrorDisplay({ title, message, code, onRetry, showReload = true }: ErrorDisplayProps) {
  const { t } = useTranslation();

  const displayTitle = title || t('errors.title');
  const displayMessage = message || t('errors.message');

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md mx-auto text-center space-y-6 p-6 border-2 border-destructive bg-destructive/10 rounded-xl shadow-lg">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-3 inline-flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-destructive">{displayTitle}</h1>
            {code && (
              <Badge variant="destructive" className="font-mono">
                {t('common.error')} {code}
              </Badge>
            )}
            <p className="leading-relaxed text-destructive/90 whitespace-pre-line">{displayMessage}</p>
          </div>
        </div>

        <div className="space-y-2">
          {showReload && (
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('common.tryAgain')}
            </Button>
          )}
          <Button variant="outline" onClick={() => window.history.back()} className="w-full">
            {t('common.goBack')}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">{t('errors.support')}</div>
      </div>
    </div>
  );
}
