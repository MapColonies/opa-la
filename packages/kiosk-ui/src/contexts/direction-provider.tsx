import { useEffect, useState, type ReactNode } from 'react';
import { DirectionProvider as RadixDirectionProvider } from '@radix-ui/react-direction';
import { useTranslation } from 'react-i18next';
import { DirectionContext } from './direction-context';

interface DirectionProviderProps {
  children: ReactNode;
}

export function DirectionProvider({ children }: DirectionProviderProps) {
  const { i18n } = useTranslation();
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(() => {
    const currentLanguage = i18n.language || 'he';
    return currentLanguage === 'he' ? 'rtl' : 'ltr';
  });

  useEffect(() => {
    const currentLanguage = i18n.language;
    const newDirection = currentLanguage === 'he' ? 'rtl' : 'ltr';
    setDirection(newDirection);

    // Also update the document direction for CSS rules
    document.documentElement.dir = newDirection;
  }, [i18n.language]);

  return (
    <DirectionContext.Provider value={{ direction }}>
      <RadixDirectionProvider dir={direction}>{children}</RadixDirectionProvider>
    </DirectionContext.Provider>
  );
}
