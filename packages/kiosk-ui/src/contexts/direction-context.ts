import { createContext } from 'react';

export interface DirectionContextType {
  direction: 'ltr' | 'rtl';
}

export const DirectionContext = createContext<DirectionContextType | undefined>(undefined);
