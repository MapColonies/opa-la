import { Navigate, type RouteObject } from 'react-router-dom';
import { Layout } from './components/layout';
import { AssetsPage } from './pages/assets';
import { ClientsPage } from './pages/clients';
import { ConnectionsPage } from './pages/connections';
import { DomainsPage } from './pages/domains';
import { ErrorPage } from './pages/error';
import { JWTInspectorPage } from './pages/jwt-inspector';
import { NotFoundPage } from './pages/not-found';
import { OPAValidatorPage } from './pages/opa-validator';

/** Shared by the application and by the tests, so both mount the same tree. */
export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/clients" replace /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'connections', element: <ConnectionsPage /> },
      { path: 'domains', element: <DomainsPage /> },
      { path: 'assets', element: <AssetsPage /> },
      { path: 'jwt-inspector', element: <JWTInspectorPage /> },
      { path: 'opa-validator', element: <OPAValidatorPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/error', element: <ErrorPage /> },
];
