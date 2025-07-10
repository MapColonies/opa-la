import { ApplicationCard } from './application-card';

export function SupportedApplications() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Supported Applications</h2>

      {/* QGIS Card */}
      <ApplicationCard
        icon="/src/assets/qgis-icon128.svg"
        iconAlt="QGIS"
        title="QGIS Desktop"
        subtitle="Open Source GIS"
        description="Mapping & analysis"
        iconBgColor="bg-green-500/10"
        checkColor="text-green-500"
      />

      {/* ArcGIS Pro Card */}
      <ApplicationCard
        icon="/src/assets/ArcGIS_logo.png"
        iconAlt="ArcGIS Pro"
        title="ArcGIS Pro"
        subtitle="Desktop Platform"
        description="Geospatial analysis"
        iconBgColor="bg-blue-500/10"
        checkColor="text-blue-500"
      />

      {/* Info Card */}
      <div className="text-xs text-muted-foreground text-center mt-4 p-3 bg-muted/20 rounded-lg">Both applications support token authentication</div>
    </div>
  );
}
