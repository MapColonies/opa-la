import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/error-boundary';
import { AuthProvider } from '@/contexts/auth-provider';
import { SnakeEasterEggProvider } from '@/contexts/snake-easter-egg-context';
import { SnakeGameDialog } from '@/components/snake-game-dialog';
import { useAuth } from '@/hooks/use-auth';
import { useSnakeEasterEgg } from '@/hooks/use-snake-easter-egg';
import { WelcomePage } from '@/pages/welcome';
import { ThemeProvider } from '@/contexts/theme-provider';
import { Layout } from '@/components/layout/layout';
import { useEffect } from 'react';
import './app.css';
import { MainPage } from '@/pages/main-page';
import { setAuthRedirectHandler } from '@/lib/http-client';

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
  return <MainPage />;
}

// Component that handles auth state and routing
function AppContent() {
  const { isAuthenticated, redirectToWelcome } = useAuth();
  const { addKeyPress } = useSnakeEasterEgg();

  // Set up global 401 handler
  useEffect(() => {
    setAuthRedirectHandler(() => {
      // Clear auth state and show welcome page
      redirectToWelcome();
    });
  }, [redirectToWelcome]);

  // Set up global keydown listener for SNAKE easter egg
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only track letter keys, ignore modifier keys and special keys
      if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
        addKeyPress(event.key.toLowerCase());
      }
    };

    // Add event listener to document
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [addKeyPress]);

  // Show welcome page if not authenticated (no loading state needed)
  if (!isAuthenticated) {
    return (
      <Layout>
        <WelcomePage />
      </Layout>
    );
  }

  // Show main app if authenticated
  return (
    <Layout>
      <AuthenticatedApp />
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="kiosk-ui-theme">
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SnakeEasterEggProvider>
              <AppContent />
              <SnakeGameDialog />
              <Toaster />
            </SnakeEasterEggProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
