import { Shield, X, Lock } from 'lucide-react';

export function LogoHeader() {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Token Kiosk Icon */}
      <div className="relative">
        <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
          <Shield className="h-8 w-8 text-primary" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <Lock className="h-2 w-2 text-white" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-6 h-px bg-border"></div>
        <X className="h-3 w-3 text-muted-foreground" />
        <div className="w-6 h-px bg-border"></div>
      </div>

      <div className="p-2 bg-muted/50 rounded-lg border">
        <img src="/src/assets/mapcolonies.png" alt="MapColonies" className="h-8 w-auto" />
      </div>
    </div>
  );
}
