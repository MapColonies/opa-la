import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/hooks/useErrorBoundary';
import { ApiClientProvider } from '@/contexts';
import { AuthProvider } from '@/contexts/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import { WelcomePage } from '@/pages/welcome';
import { ThemeProvider } from '@/components/theme-provider';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { setAuthRedirectHandler } from '@/lib/httpClient';
import { useEffect } from 'react';
import './App.css';

// Create a single QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Component that shows the main app for authenticated users
function AuthenticatedApp() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header with theme toggle and user info */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Token Kiosk</h1>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                {user.picture ? <img src={user.picture} alt={user.name || 'User'} className="h-8 w-8 rounded-full" /> : <User className="h-4 w-4" />}
                <span className="text-sm font-medium">{user.name || user.email}</span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto py-8 space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Welcome to Token Kiosk</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Generate and manage temporary access tokens for MapColonies services. Your secure gateway to enterprise-grade authentication and
            authorization.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-lg font-semibold mb-2">Token Generation</h3>
            <p className="text-muted-foreground mb-4">Create temporary access tokens with customizable expiration times and permissions.</p>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-lg font-semibold mb-2">Token Management</h3>
            <p className="text-muted-foreground mb-4">View, revoke, and manage your active tokens with detailed usage analytics.</p>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-lg font-semibold mb-2">Service Access</h3>
            <p className="text-muted-foreground mb-4">Seamlessly access MapColonies services with your generated tokens.</p>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

// Component that handles auth state and routing
function AppContent() {
  const { isAuthenticated, isLoading, redirectToWelcome } = useAuth();

  // Set up global 401 handler
  useEffect(() => {
    setAuthRedirectHandler(() => {
      // Clear auth state and show welcome page
      redirectToWelcome();
    });
  }, [redirectToWelcome]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show welcome page if not authenticated
  if (!isAuthenticated) {
    return <WelcomePage />;
  }

  // Show main app if authenticated
  return <AuthenticatedApp />;
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="kiosk-ui-theme">
      <ErrorBoundary>
        <AuthProvider>
          <ApiClientProvider>
            <QueryClientProvider client={queryClient}>
              <AppContent />
              <Toaster />
            </QueryClientProvider>
          </ApiClientProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
