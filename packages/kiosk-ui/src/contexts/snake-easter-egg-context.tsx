import { createContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface SnakeEasterEggContextType {
  isSnakeGameOpen: boolean;
  openSnakeGame: () => void;
  closeSnakeGame: () => void;
  addKeyPress: (key: string) => void;
}

const SnakeEasterEggContext = createContext<SnakeEasterEggContextType | undefined>(undefined);

export { SnakeEasterEggContext };

const SNAKE_SEQUENCE = ['S', 'N', 'A', 'K', 'E'];

interface SnakeEasterEggProviderProps {
  children: ReactNode;
}

export function SnakeEasterEggProvider({ children }: SnakeEasterEggProviderProps) {
  const [isSnakeGameOpen, setIsSnakeGameOpen] = useState(false);
  const [, setKeySequence] = useState<string[]>([]);

  const openSnakeGame = useCallback(() => {
    setIsSnakeGameOpen(true);
  }, []);

  const closeSnakeGame = useCallback(() => {
    setIsSnakeGameOpen(false);
    setKeySequence([]); // Reset sequence when closing
  }, []);

  const addKeyPress = useCallback(
    (key: string) => {
      const keyChar = key.toUpperCase();

      setKeySequence((prev) => {
        const newSequence = [...prev];
        const expectedChar = SNAKE_SEQUENCE[newSequence.length];

        if (keyChar === expectedChar) {
          newSequence.push(keyChar);

          // Check if we completed the sequence
          if (newSequence.length === SNAKE_SEQUENCE.length) {
            setTimeout(() => {
              openSnakeGame();
            }, 100);
            return [];
          }

          return newSequence;
        } else if (keyChar === SNAKE_SEQUENCE[0]) {
          // If they press 'S', start over
          return [keyChar];
        } else {
          // Reset if wrong character
          return [];
        }
      });
    },
    [openSnakeGame]
  );

  return (
    <SnakeEasterEggContext.Provider
      value={{
        isSnakeGameOpen,
        openSnakeGame,
        closeSnakeGame,
        addKeyPress,
      }}
    >
      {children}
    </SnakeEasterEggContext.Provider>
  );
}
