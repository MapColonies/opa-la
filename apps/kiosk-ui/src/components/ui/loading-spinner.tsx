import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ message, size = 'md' }: LoadingSpinnerProps) {
  const { t } = useTranslation();
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  // If message is a translation key, use it; otherwise use the message directly or fallback to loading
  const getDisplayMessage = (): string => {
    if (!message) return t('common.loading');

    // Handle specific known translation keys
    if (message === 'errors.checking') return t('errors.checking');
    if (message === 'errors.redirecting') return t('errors.redirecting');

    // Otherwise, return the message as-is
    return message;
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className={`${sizeClasses[size]} animate-spin mx-auto text-primary`} />
        <p className="text-muted-foreground">{getDisplayMessage()}</p>
      </div>
    </div>
  );
}
