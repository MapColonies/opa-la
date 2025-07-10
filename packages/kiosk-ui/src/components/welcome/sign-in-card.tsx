import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

interface SignInCardProps {
  onSignIn: () => void;
}

export function SignInCard({ onSignIn }: SignInCardProps) {
  return (
    <div className="text-center mb-6">
      <Card className="max-w-md mx-auto bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl mb-2">Get Your Token</CardTitle>
          <CardDescription className="text-sm">Sign in to generate a temporary access token for your GIS applications.</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Button onClick={onSignIn} size="lg" className="w-full h-11 font-medium">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
