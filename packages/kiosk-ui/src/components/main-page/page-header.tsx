import { useTranslation } from 'react-i18next';
import { LogoHeader } from './logo-header';

export function PageHeader() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <LogoHeader />

      {/* Title and Description */}
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-bold text-foreground">{t('page.title')}</h1>
        <div className="space-y-2">
          <p className="text-lg text-muted-foreground leading-relaxed">{t('page.description')}</p>
          <p className="text-sm text-muted-foreground/80">{t('page.subtitle')}</p>
        </div>
      </div>
    </div>
  );
}
