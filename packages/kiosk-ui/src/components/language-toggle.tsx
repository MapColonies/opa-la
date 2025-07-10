import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function LanguageToggle() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('kiosk-ui-language', language);

    // Update document direction for RTL support
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;

    // Apply appropriate font family
    if (language === 'he') {
      document.documentElement.className = document.documentElement.className.replace(/font-\w+/g, '') + ' font-hebrew';
    } else {
      document.documentElement.className = document.documentElement.className.replace(/font-\w+/g, '') + ' font-sans';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="hover:bg-muted/50 dark:hover:bg-muted hover:border-muted-foreground/20 dark:hover:border-muted-foreground/30 transition-colors"
        >
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t('language.toggle')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage('en')}>{t('language.english')}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('he')}>{t('language.hebrew')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
