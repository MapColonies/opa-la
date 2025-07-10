import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';

interface TokenData {
  token: string;
  expiration: string;
}

interface TokenDisplayProps {
  tokenData: TokenData;
  copied: boolean;
  onCopy: () => void;
  onRequestAgain: () => void;
}

export function TokenDisplay({ tokenData, copied, onCopy, onRequestAgain }: TokenDisplayProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
          <span className="text-green-700 dark:text-green-400 font-semibold">{t('token.generation.success')}</span>
        </div>
        <p className="text-xs text-muted-foreground">{t('token.generation.successDescription')}</p>
      </div>

      {/* Token Display */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">{t('token.display.label')}</label>
        <div className="relative">
          <div className="max-h-[100px] overflow-y-auto border rounded-lg bg-muted/20 p-3">
            <code className="font-mono text-xs select-all text-foreground break-words whitespace-pre-wrap">{tokenData.token}</code>
          </div>
        </div>
      </div>

      {/* Expiration Info */}
      <div className="bg-muted/30 rounded-lg p-3 text-center space-y-1">
        <div className="text-sm font-medium text-foreground">{t('token.display.expires')}</div>
        <div className="text-sm font-mono text-muted-foreground">{format(new Date(tokenData.expiration), 'dd/MM/yyyy HH:mm')}</div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={onCopy} className="flex items-center gap-2 flex-1" size="default">
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-500" />
              {t('token.display.copied')}
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              {t('token.display.copy')}
            </>
          )}
        </Button>
        <Button variant="secondary" onClick={onRequestAgain} className="flex-1" size="default">
          {t('token.display.generateNew')}
        </Button>
      </div>
    </div>
  );
}
