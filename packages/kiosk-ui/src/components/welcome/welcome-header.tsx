import { Shield, X, Lock } from 'lucide-react';

export function WelcomeHeader() {
  return (
    <div className="relative">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-transparent" />

      <div className="relative z-10 text-center py-12 px-6">
        {/* Logo Section - More compact and professional */}
        <div className="flex justify-center items-center mb-6">
          <div className="flex items-center gap-4">
            {/* Token Kiosk Icon */}
            <div className="relative">
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                <Shield className="h-12 w-12 text-primary" />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Lock className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
            </div>

            {/* Simple connector */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-px bg-border"></div>
              <X className="h-4 w-4 text-muted-foreground" />
              <div className="w-8 h-px bg-border"></div>
            </div>

            {/* MapColonies Logo */}
            <div className="p-3 bg-muted/50 rounded-xl border">
              <img src="/src/assets/mapcolonies.png" alt="MapColonies" className="h-12 w-auto" />
            </div>
          </div>
        </div>

        {/* Title Section - More professional */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Token Kiosk</h1>

          <p className="text-lg text-muted-foreground leading-relaxed">Generate secure temporary tokens for GIS desktop applications</p>

          <p className="text-sm text-muted-foreground/80">Professional authentication for QGIS and ArcGIS Pro</p>
        </div>

        {/* Status indicators - Professional and subtle */}
        <div className="flex justify-center gap-6 mt-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Enterprise</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Professional</span>
          </div>
        </div>
      </div>
    </div>
  );
}
