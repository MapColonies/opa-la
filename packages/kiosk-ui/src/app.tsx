import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/error-boundary';
import { AuthProvider } from '@/contexts/auth-provider';
import { useAuth } from '@/hooks/use-auth';
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

  // Set up global 401 handler
  useEffect(() => {
    setAuthRedirectHandler(() => {
      // Clear auth state and show welcome page
      redirectToWelcome();
    });
  }, [redirectToWelcome]);

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
            <AppContent />
            <Toaster />
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
