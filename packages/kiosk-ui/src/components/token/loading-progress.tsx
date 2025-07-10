import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface LoadingProgressProps {
  progress: number;
  message?: string;
}

export function LoadingProgress({ progress, message }: LoadingProgressProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-medium text-foreground">{t('token.generation.buttonLoading')}</span>
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="w-full h-2" />
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{message || t('token.generation.progressMessage')}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">{t('token.generation.waitMessage')}</p>
    </div>
  );
}
