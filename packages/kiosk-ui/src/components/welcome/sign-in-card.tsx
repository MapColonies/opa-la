import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LogIn, Shield, Clock, Users, ChevronRight } from 'lucide-react';

interface SignInCardProps {
  onSignIn: () => void;
}

export function SignInCard({ onSignIn }: SignInCardProps) {
  return (
    <div className="py-16 px-6 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        {/* Attention-grabbing header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground">Sign in with your credentials to generate your secure access token</p>
        </div>

        {/* Main CTA Card - Much more prominent */}
        <Card className="relative border-2 border-primary/20 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground mb-2">Sign In to Continue</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Authenticate with your organization credentials to access the Token Kiosk
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Quick info - Work-focused */}
            <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Secure Authentication</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-muted-foreground">Temporary Tokens</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-muted-foreground">Enterprise Ready</span>
              </div>
            </div>

            {/* Large, prominent sign-in button */}
            <div className="space-y-4">
              <Button
                onClick={onSignIn}
                size="lg"
                className="w-full h-16 text-xl font-semibold bg-primary hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <div className="relative flex items-center justify-center gap-3">
                  <LogIn className="h-6 w-6" />
                  <span>Sign In with Organization Account</span>
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Button>

              <p className="text-center text-sm text-muted-foreground">Contact your IT administrator if you need access credentials</p>
            </div>

            {/* Security notice */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Enterprise Security</p>
                  <p className="text-blue-700 dark:text-blue-200">
                    Your authentication is handled securely through your organization's identity provider. Tokens are temporary and automatically
                    expire for enhanced security.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional help */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">Need help? Contact your system administrator or IT support team</p>
        </div>
      </div>
    </div>
  );
}
