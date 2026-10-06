import { Navigate, type RouteObject } from 'react-router-dom';
import { Layout } from './components/layout';
import { AssetPage, AssetsPage, CreateAssetPage } from './pages/assets';
import { BundlesPage } from './pages/bundles';
import { ClientsPage } from './pages/clients';
import { ConnectionsPage } from './pages/connections';
import { DomainsPage } from './pages/domains';
import { ErrorPage, RouteErrorPage } from './pages/error';
import { JWTInspectorPage } from './pages/jwt-inspector';
import { NotFoundPage } from './pages/not-found';
import { OPAValidatorPage } from './pages/opa-validator';

/** Shared by the application and by the tests, so both mount the same tree. */
export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    // A data router catches a render error itself, so the application's error screen has
    // to be handed to it; the react error boundary around the tree no longer sees these.
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="/clients" replace /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'connections', element: <ConnectionsPage /> },
      { path: 'domains', element: <DomainsPage /> },
      // The application's first nested routes. An asset opens as a full page rather than a
      // dialog, per ADR-0001: a code editor tall enough to review a policy does not fit one.
      {
        path: 'assets',
        children: [
          { index: true, element: <AssetsPage /> },
          { path: 'new', element: <CreateAssetPage /> },
          { path: ':assetName', element: <AssetPage /> },
        ],
      },
      { path: 'bundles', element: <BundlesPage /> },
      { path: 'jwt-inspector', element: <JWTInspectorPage /> },
      { path: 'opa-validator', element: <OPAValidatorPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/error', element: <ErrorPage /> },
];
