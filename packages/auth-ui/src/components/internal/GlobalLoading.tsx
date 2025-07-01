import { cn } from '../../lib/utils';

interface GlobalLoadingProps {
  className?: string;
  text?: string;
}

export const GlobalLoading = ({ className, text = 'Loading...' }: GlobalLoadingProps) => {
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-screen', className)}>
      <div className="relative">
        <div className="w-12 h-12 border-4 border-primary/30 rounded-full animate-pulse"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary rounded-full animate-spin border-t-transparent"></div>
      </div>
      <h2 className="mt-4 text-2xl font-bold text-primary">OPA Admin</h2>
      <p className="mt-2 text-muted-foreground">{text}</p>
    </div>
  );
};
