import { LogoHeader } from './logo-header';

export function PageHeader() {
  return (
    <div className="space-y-6">
      <LogoHeader />

      {/* Title and Description */}
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-bold text-foreground">Token Kiosk</h1>
        <div className="space-y-2">
          <p className="text-lg text-muted-foreground leading-relaxed">Generate temporary tokens for GIS desktop applications</p>
          <p className="text-sm text-muted-foreground/80">Authentication for QGIS and ArcGIS Pro</p>
        </div>
      </div>
    </div>
  );
}
