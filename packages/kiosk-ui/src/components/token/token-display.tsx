import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  return (
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
        <Button size="sm" variant="outline" onClick={onCopy} className="flex items-center gap-2 w-full sm:w-auto">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          Copy Token
        </Button>
        <Button size="sm" variant="secondary" onClick={onRequestAgain} className="transition-colors duration-100 w-full sm:w-auto">
          Request Token Again
        </Button>
      </div>
    </Alert>
  );
}
