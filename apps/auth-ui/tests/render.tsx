import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactNode } from 'react';
import { RouterProvider, createMemoryRouter, type RouteObject } from 'react-router-dom';
import { ThemeProvider } from '../src/components/theme-provider';
import { ConfigProvider } from '../src/contexts/ConfigProvider';
import { Toaster } from '../src/components/ui/sonner';

export interface RenderedRoutes extends RenderResult {
  router: ReturnType<typeof createMemoryRouter>;
  queryClient: QueryClient;
}

/**
 * Renders real route objects through the real providers, on a memory data router.
 * A data router rather than the plain one because the asset editor's navigation
 * guard needs `useBlocker`.
 */
export const renderRoutes = (routes: RouteObject[], initialPath = '/'): RenderedRoutes => {
  // No retries: a stubbed failure should surface as an error state on the first pass.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });

  const result = render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ConfigProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster />
        </QueryClientProvider>
      </ConfigProvider>
    </ThemeProvider>
  );

  return { ...result, router, queryClient };
};

/** Renders a single element at every path, for a component with no route of its own. */
export const renderWithProviders = (ui: ReactNode, initialPath = '/'): RenderedRoutes => renderRoutes([{ path: '*', element: ui }], initialPath);
