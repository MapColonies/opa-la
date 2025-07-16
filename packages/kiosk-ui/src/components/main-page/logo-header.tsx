import { Shield, X, Lock } from 'lucide-react';

export function LogoHeader() {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Token Kiosk Icon */}
      <div className="relative flex items-center justify-center" style={{ width: '80px', height: '80px' }}>
        <div className="p-0 bg-primary/10 rounded-xl border border-primary/20 w-full h-full flex items-center justify-center">
          <Shield className="h-16 w-16 text-primary" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <Lock className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-6 h-px bg-border"></div>
        <X className="h-3 w-3 text-muted-foreground" />
        <div className="w-6 h-px bg-border"></div>
      </div>

      <div className="p-0 bg-muted/50 rounded-lg border flex items-center justify-center" style={{ width: '80px', height: '80px' }}>
        <img src="/src/assets/mapcolonies.png" alt="MapColonies" className="h-16 w-16 object-contain" />
      </div>
    </div>
  );
}
