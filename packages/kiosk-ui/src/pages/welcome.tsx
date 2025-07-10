import { useAuth } from '@/hooks/use-auth';
import { WelcomeHeader, SupportedApps, SignInCard } from '@/components/welcome';

export function WelcomePage() {
  const { login } = useAuth();

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-4">
      <div className="w-full max-w-5xl mx-auto">
        <WelcomeHeader />
        <SupportedApps />
        <SignInCard onSignIn={login} />
      </div>
    </div>
  );
}
