import { useContext } from 'react';
import { SnakeEasterEggContext } from '@/contexts/snake-easter-egg-context';

export function useSnakeEasterEgg() {
  const context = useContext(SnakeEasterEggContext);
  if (context === undefined) {
    throw new Error('useSnakeEasterEgg must be used within a SnakeEasterEggProvider');
  }
  return context;
}
