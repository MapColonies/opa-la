import { useContext } from 'react';
import { DirectionContext } from '@/contexts/direction-context';

export function useDirection() {
  const context = useContext(DirectionContext);
  if (context === undefined) {
    throw new Error('useDirection must be used within a DirectionProvider');
  }
  return context;
}
