import { useTranslation } from 'react-i18next';
import { ApplicationCard } from './application-card';
import { $api } from '@/lib/http-client';
import ArcGISLogo from '@/assets/ArcGIS_logo.png';
import QGISLogo from '@/assets/qgis-icon128.svg';

export function SupportedApplications() {
  const { t } = useTranslation();
  const { data: guides } = $api.useQuery('get', '/guides', undefined, { enabled: true });

  return (
    <div className="space-y-4 mt-10.5">
      <h2 className="text-xl font-semibold text-foreground">{t('applications.title')}</h2>

      {/* QGIS Card */}
      <ApplicationCard
        disable={!guides?.enabled} // Disable if guides are not enabled
        icon={QGISLogo}
        iconAlt={t('applications.qgis.alt')}
        title={t('applications.qgis.title')}
        subtitle={t('applications.qgis.subtitle')}
        description={t('applications.qgis.description')}
        iconBgColor="bg-green-500/10"
        checkColor="text-green-500"
        link={guides?.qgis}
        shadowColor="rgba(34,197,94,0.15)" // green shadow
      />

      {/* ArcGIS Pro Card */}
      <ApplicationCard
        disable={!guides?.enabled} // Disable if guides are not enabled
        icon={ArcGISLogo}
        iconAlt={t('applications.arcgis.alt')}
        title={t('applications.arcgis.title')}
        subtitle={t('applications.arcgis.subtitle')}
        description={t('applications.arcgis.description')}
        iconBgColor="bg-blue-500/10"
        checkColor="text-blue-500"
        link={guides?.arcgis}
        shadowColor="rgba(59,130,246,0.15)" // blue shadow
      />
    </div>
  );
}
