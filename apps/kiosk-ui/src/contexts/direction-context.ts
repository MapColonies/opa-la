import { createContext } from 'react';

interface DirectionContextType {
  direction: 'ltr' | 'rtl';
}

export const DirectionContext = createContext<DirectionContextType | undefined>(undefined);
