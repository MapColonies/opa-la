import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SelectableDropdownMenuItem } from '@/components/ui/selectable-dropdown-menu-item';

export function LanguageToggle() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('kiosk-ui-language', language);

    // Update document language
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
        <SelectableDropdownMenuItem onClick={() => changeLanguage('en')} selected={i18n.language === 'en'}>
          {t('language.english')}
        </SelectableDropdownMenuItem>
        <SelectableDropdownMenuItem onClick={() => changeLanguage('he')} selected={i18n.language === 'he'}>
          {t('language.hebrew')}
        </SelectableDropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
