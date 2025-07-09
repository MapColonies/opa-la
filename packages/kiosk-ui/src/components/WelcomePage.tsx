import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';

export function WelcomePage() {
  const handleLogin = () => {
    // Redirect to the Auth0 login endpoint provided by express-openid-connect
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with theme toggle */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Token Kiosk</h1>
          <ModeToggle />
        </div>
      </header>

      {/* Welcome content */}
      <main className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center space-y-6 max-w-md">
          <div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Welcome to Token Kiosk</h2>
            <p className="text-xl text-muted-foreground">Secure token management at your fingertips</p>
          </div>

          <div className="space-y-4">
            <p className="text-muted-foreground">Please sign in to access your token management dashboard and continue with secure operations.</p>

            <Button onClick={handleLogin} size="lg" className="w-full">
              Sign In
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Powered by Auth0 for secure authentication</p>
          </div>
        </div>
      </main>
    </div>
  );
}
