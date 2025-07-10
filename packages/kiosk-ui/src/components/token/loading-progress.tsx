import { Progress } from '@/components/ui/progress';

interface LoadingProgressProps {
  progress: number;
  message?: string;
}

export function LoadingProgress({ progress, message = 'Generating token, please wait...' }: LoadingProgressProps) {
  return (
    <div className="w-full flex flex-col items-center gap-2">
      <Progress value={progress} className="w-full" />
      <span className="text-muted-foreground text-xs">{message}</span>
    </div>
  );
}
