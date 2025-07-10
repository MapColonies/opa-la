export function SupportedApps() {
  return (
    <div className="flex justify-center items-center gap-8 mb-8">
      <div className="flex flex-col items-center">
        <img src="/src/assets/qgis-icon128.svg" alt="QGIS" className="h-12 w-12 mb-2" />
        <span className="text-sm text-muted-foreground">QGIS Desktop</span>
      </div>
      <div className="flex flex-col items-center">
        <img src="/src/assets/ArcGIS_logo.png" alt="ArcGIS Pro" className="h-12 w-auto mb-2" />
        <span className="text-sm text-muted-foreground">ArcGIS Pro</span>
      </div>
    </div>
  );
}
