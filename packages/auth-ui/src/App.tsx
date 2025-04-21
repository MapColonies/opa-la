import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { ClientsPage } from './pages/clients';
import { ConnectionsPage } from './pages/connections';
import { DomainsPage } from './pages/domains';
import { JWTInspectorPage } from './pages/jwt-inspector';
import { NotFoundPage } from './pages/not-found';
import { ErrorPage } from './pages/error';
import { Toaster } from './components/ui/sonner';
import { ConfigProvider } from './contexts/ConfigProvider';
import { ErrorBoundary } from './hooks/useErrorBoundary';

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <ConfigProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/clients" replace />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="connections" element={<ConnectionsPage />} />
                <Route path="domains" element={<DomainsPage />} />
                <Route path="jwt-inspector" element={<JWTInspectorPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              <Route path="/error" element={<ErrorPage />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </QueryClientProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
