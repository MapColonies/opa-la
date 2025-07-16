import { useTranslation } from 'react-i18next';
import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SelectableDropdownMenuItem } from '@/components/ui/selectable-dropdown-menu-item';
import { useTheme } from '@/hooks';

export function ModeToggle() {
  const { t } = useTranslation();
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="hover:bg-muted/50 dark:hover:bg-muted hover:border-muted-foreground/20 dark:hover:border-muted-foreground/30 transition-colors"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t('theme.toggle')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <SelectableDropdownMenuItem onClick={() => setTheme('light')} selected={theme === 'light'}>
          {t('theme.light')}
        </SelectableDropdownMenuItem>
        <SelectableDropdownMenuItem onClick={() => setTheme('dark')} selected={theme === 'dark'}>
          {t('theme.dark')}
        </SelectableDropdownMenuItem>
        <SelectableDropdownMenuItem onClick={() => setTheme('system')} selected={theme === 'system'}>
          {t('theme.system')}
        </SelectableDropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
