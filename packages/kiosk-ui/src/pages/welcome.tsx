import { useAuth } from '@/hooks/use-auth';
import { WelcomeHeader, SupportedApps, SignInCard } from '@/components/welcome';

export function WelcomePage() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full">
        <WelcomeHeader />
        <SupportedApps />
        <SignInCard onSignIn={login} />
      </div>
    </div>
  );
}
