import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { ModeToggle } from '@/components/mode-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { User } from 'lucide-react';
import { useEffect } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  // Set up RTL direction based on current language
  useEffect(() => {
    const currentLanguage = i18n.language;
    document.documentElement.dir = currentLanguage === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;

    // Apply Hebrew font family when Hebrew is selected
    if (currentLanguage === 'he') {
      document.documentElement.className = document.documentElement.className.replace(/font-\w+/g, '') + ' font-hebrew';
    } else {
      document.documentElement.className = document.documentElement.className.replace(/font-\w+/g, '') + ' font-sans';
    }
  }, [i18n.language]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t('layout.title')}</h1>
          <div className="flex items-center gap-4">
            {isAuthenticated && user && (
              <div className="flex items-center gap-3">
                {user.picture ? (
                  <img src={user.picture} alt={user.name || t('common.user')} className="h-8 w-8 rounded-full" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{user.name || user.email}</span>
              </div>
            )}
            <LanguageToggle />
            <ModeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
