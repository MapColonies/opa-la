import { cn } from '../../lib/utils';

interface LivenessIndicatorProps {
  isAlive: boolean;
  className?: string;
}

export const LivenessIndicator = ({ isAlive, className }: LivenessIndicatorProps) => {
  return <div className={cn('w-2 h-2 rounded-full', isAlive ? 'bg-green-500 animate-pulse' : 'bg-gray-300', className)} />;
};
