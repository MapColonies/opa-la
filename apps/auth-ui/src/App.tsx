import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { ConfigProvider } from './contexts/ConfigProvider';
import { ErrorBoundary } from './hooks/useErrorBoundary';
import { ThemeProvider } from './components/theme-provider';
import { appRoutes } from './routes';

const queryClient = new QueryClient();

// A data router rather than <BrowserRouter>: the asset editor's unsaved-work guard
// needs useBlocker, which only a data router provides.
const router = createBrowserRouter(appRoutes);

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ConfigProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <Toaster />
          </QueryClientProvider>
        </ConfigProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
