import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { LogIn, Shield, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function WelcomePage() {
  const { login } = useAuth();

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-4">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
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

        {/* Supported Applications */}
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

        {/* CTA Section */}
        <div className="text-center mb-6">
          <Card className="max-w-md mx-auto bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl mb-2">Get Your Token</CardTitle>
              <CardDescription className="text-sm">Sign in to generate a temporary access token for your GIS applications.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Button onClick={login} size="lg" className="w-full h-11 font-medium">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
