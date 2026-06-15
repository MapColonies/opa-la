import { createContext } from 'react';

interface SnakeEasterEggContextType {
  isSnakeGameOpen: boolean;
  openSnakeGame: () => void;
  closeSnakeGame: () => void;
  addKeyPress: (key: string) => void;
}

const SnakeEasterEggContext = createContext<SnakeEasterEggContextType | undefined>(undefined);

export { SnakeEasterEggContext };
