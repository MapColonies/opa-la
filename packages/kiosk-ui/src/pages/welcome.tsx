import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, Shield, Zap, Globe } from 'lucide-react';

export function WelcomePage() {
  const { login, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Welcome to <span className="text-primary">Token Kiosk</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your secure gateway to MapColonies services. Generate and manage temporary access tokens with enterprise-grade security.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 rounded-lg bg-card border">
            <div className="flex justify-center mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Fast & Secure</h3>
            <p className="text-muted-foreground">Generate temporary access tokens instantly with bank-level security protocols.</p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card border">
            <div className="flex justify-center mb-4">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">MapColonies Integration</h3>
            <p className="text-muted-foreground">Seamlessly access all MapColonies services with unified authentication.</p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card border">
            <div className="flex justify-center mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Enterprise Ready</h3>
            <p className="text-muted-foreground">Built for organizations with advanced security and compliance requirements.</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-card border rounded-lg p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-6">Sign in with your organization credentials to access the token management dashboard.</p>
            <Button onClick={login} disabled={isLoading} size="lg" className="w-full">
              <LogIn className="mr-2 h-5 w-5" />
              {isLoading ? 'Loading...' : 'Sign In'}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 pt-8 border-t">
          <p className="text-sm text-muted-foreground">Powered by Auth0 • Enterprise Security • MapColonies Platform</p>
        </footer>
      </div>
    </div>
  );
}
