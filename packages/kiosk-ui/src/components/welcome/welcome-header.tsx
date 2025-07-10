import { Shield, X } from 'lucide-react';

export function WelcomeHeader() {
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center items-center gap-4 mb-4">
        <div className="p-4 bg-primary/10 rounded-xl">
          <Shield className="h-12 w-12 text-primary" />
        </div>
        <div className="flex items-center justify-center">
          <X className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm">
          <img src="/src/assets/mapcolonies.png" alt="MapColonies" className="h-20 w-auto" />
        </div>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        Token Kiosk
      </h1>
      <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
        Generate secure temporary tokens for GIS desktop applications like QGIS and ArcGIS Pro.
      </p>
    </div>
  );
}
