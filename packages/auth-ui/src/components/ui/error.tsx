import { cn } from '../../lib/utils';
import { AlertCircle } from 'lucide-react';

interface ErrorProps {
  className?: string;
  title?: string;
  message?: string;
}

export const Error = ({ className, title = 'Something went wrong', message = 'An error occurred while loading the application.' }: ErrorProps) => {
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-screen p-4', className)}>
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold text-primary mb-2">OPA Admin</h2>
        <h3 className="text-xl font-semibold text-destructive mb-2">{title}</h3>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};
