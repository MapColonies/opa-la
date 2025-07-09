import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { LogIn, Shield, Zap, Globe } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function WelcomePage() {
  const { login, isLoading } = useAuth();

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-4">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-xl">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Welcome to Token Kiosk
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Your secure gateway to MapColonies services with enterprise-grade security.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center hover:border-primary/20 transition-colors duration-200">
            <CardHeader className="pb-3 pt-4">
              <div className="flex justify-center mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-lg mb-2">Fast & Secure</CardTitle>
              <CardDescription className="text-sm">Generate tokens instantly with bank-level security.</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:border-primary/20 transition-colors duration-200">
            <CardHeader className="pb-3 pt-4">
              <div className="flex justify-center mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-lg mb-2">MapColonies Ready</CardTitle>
              <CardDescription className="text-sm">Seamless access to all MapColonies services.</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:border-primary/20 transition-colors duration-200">
            <CardHeader className="pb-3 pt-4">
              <div className="flex justify-center mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-lg mb-2">Enterprise Grade</CardTitle>
              <CardDescription className="text-sm">Built for organizations with advanced security needs.</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mb-6">
          <Card className="max-w-md mx-auto bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl mb-2">Ready to Get Started?</CardTitle>
              <CardDescription className="text-sm">Sign in to access the token management dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Button onClick={login} disabled={isLoading} size="lg" className="w-full h-11 font-medium">
                <LogIn className="mr-2 h-4 w-4" />
                {isLoading ? 'Loading...' : 'Sign In'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
