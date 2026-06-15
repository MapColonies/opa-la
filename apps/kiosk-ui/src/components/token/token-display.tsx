import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Check, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

interface TokenData {
  token: string;
  expiration: string;
}

interface TokenDisplayProps {
  tokenData: TokenData;
  onCopy: () => void;
}

export function TokenDisplay({ tokenData, onCopy }: TokenDisplayProps) {
  const { t } = useTranslation();

  // Click-to-copy handler for the token area
  const handleTokenClick = async () => {
    try {
      await navigator.clipboard.writeText(tokenData.token);
      toast.success(t('token.display.copied'));
      onCopy();
    } catch {
      toast.error(t('token.display.copy'));
    }
  };

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
          <button
            type="button"
            aria-label={t('token.display.copy')}
            onClick={handleTokenClick}
            className="border rounded-lg bg-muted/20 p-3 max-h-[100px] w-full overflow-y-auto overflow-x-hidden cursor-pointer transition ring-2 ring-transparent focus:ring-primary focus:outline-none relative"
            tabIndex={0}
          >
            <code className="font-mono text-xs select-all text-foreground break-words whitespace-pre-wrap block pr-8">{tokenData.token}</code>
            <button
              type="button"
              aria-label={t('token.display.copy')}
              className="absolute top-2 right-2 p-1 rounded-md bg-background border border-muted shadow hover:bg-muted transition focus:outline-none focus:ring-2 focus:ring-primary"
              tabIndex={0}
            >
              <Copy className="w-4 h-4 text-muted-foreground" />
            </button>
          </button>
        </div>
      </div>

      {/* Expiration Info */}
      <div className="bg-muted/30 rounded-lg p-3 text-center space-y-1">
        <div className="text-sm font-medium text-foreground">{t('token.display.expires')}</div>
        <div className="text-sm font-mono text-muted-foreground">{format(new Date(tokenData.expiration), 'dd/MM/yyyy HH:mm')}</div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="flex items-center gap-2 flex-1 bg-white shadow-green-300 hover:bg-green-50 transition"
          size="default"
          onClick={() => {
            window.open('/api/files/qlr', '_blank');
          }}
          aria-label={t('token.display.downloadQlr')}
        >
          <Download className="w-4 h-4 text-green-500" />
          {t('token.display.downloadQlr')}
        </Button>
        <Button
          variant="outline"
          className="flex items-center gap-2 flex-1 bg-white shadow-blue-300 hover:bg-blue-50 transition"
          size="default"
          onClick={() => {
            window.open('/api/files/lyrx', '_blank');
          }}
          aria-label={t('token.display.downloadLyrx')}
        >
          <Download className="w-4 h-4 text-blue-500" />
          {t('token.display.downloadLyrx')}
        </Button>
      </div>
    </div>
  );
}
