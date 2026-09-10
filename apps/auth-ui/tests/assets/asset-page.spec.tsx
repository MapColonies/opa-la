import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { REGO_LANGUAGE_ID, REGO_TEMPLATE_LANGUAGE_ID } from '@/lib/monaco/language-ids';
import { AssetDiffEditor } from '@/components/asset-editor';
import { appRoutes } from '../../src/routes';
import { anAsset, encodeText } from '../asset-fixtures';
import { http } from '../http-stub';
import { renderRoutes, renderWithProviders } from '../render';

const openAsset = (name = 'authz.rego') => renderRoutes(appRoutes, `/assets/${encodeURIComponent(name)}`);

/** Base64 of bytes that are not valid utf-8. */
const invalidTextValue = btoa(String.fromCharCode(0xff, 0xfe, 0x41));

describe('opening an asset', () => {
  it('opens from the list into a nested route of its own', async () => {
    http.on('GET', '/asset', { body: [anAsset({ name: 'authz.rego' })] });
    http.on('GET', '/asset/authz.rego', { body: [anAsset({ name: 'authz.rego' })] });

    const { router } = renderRoutes(appRoutes, '/assets');
    await userEvent.click(await screen.findByRole('link', { name: 'authz.rego' }));

    expect(router.state.location.pathname).toBe('/assets/authz.rego');
    expect(await screen.findByRole('heading', { name: 'authz.rego' })).toBeInTheDocument();
  });

  it('is reachable straight from its url', async () => {
    http.on('GET', '/asset/authz.rego', { body: [anAsset({ value: encodeText('package authz\n') })] });

    openAsset();

    expect(await screen.findByRole('heading', { name: 'authz.rego' })).toBeInTheDocument();
    expect(await screen.findByTestId('monaco-editor')).toHaveValue('package authz\n');
  });

  it('shows the latest asset version, from a response of more than one', async () => {
    http.on('GET', '/asset/authz.rego', {
      body: [
        anAsset({ version: 1, value: encodeText('first') }),
        anAsset({ version: 3, value: encodeText('newest') }),
        anAsset({ version: 2, value: encodeText('middle') }),
      ],
    });

    openAsset();

    expect(await screen.findByTestId('monaco-editor')).toHaveValue('newest');
    expect(screen.getByText('Asset version').nextElementSibling).toHaveTextContent('3');
  });

  it('renders a single-version response with no special case', async () => {
    http.on('GET', '/asset/authz.rego', { body: [anAsset({ version: 7, value: encodeText('only') })] });

    openAsset();

    expect(await screen.findByTestId('monaco-editor')).toHaveValue('only');
    expect(screen.getByText('Asset version').nextElementSibling).toHaveTextContent('7');
  });

  it('opens rego content under the rego language, and a template under its own', async () => {
    http.on('GET', '/asset/authz.rego', { body: [anAsset({ type: 'POLICY', isTemplate: false })] });

    const { unmount } = openAsset();
    expect(await screen.findByTestId('monaco-editor')).toHaveAttribute('data-language', REGO_LANGUAGE_ID);
    unmount();

    http.on('GET', '/asset/authz.rego', { body: [anAsset({ type: 'POLICY', isTemplate: true })] });
    openAsset();
    expect(await screen.findByTestId('monaco-editor')).toHaveAttribute('data-language', REGO_TEMPLATE_LANGUAGE_ID);
  });

  it('gives the editor the full height of its container rather than the height of its content', async () => {
    http.on('GET', '/asset/authz.rego', { body: [anAsset()] });

    openAsset();

    expect(await screen.findByTestId('monaco-editor')).toHaveAttribute('data-height', '100%');
  });

  it('follows a theme change without remounting the editor', async () => {
    http.on('GET', '/asset/authz.rego', { body: [anAsset()] });

    openAsset();
    const editor = await screen.findByTestId('monaco-editor');
    expect(editor).toHaveAttribute('data-theme', 'light');

    await userEvent.click(await screen.findByRole('button', { name: 'Switch to dark mode' }));

    expect(screen.getByTestId('monaco-editor')).toBe(editor);
    expect(editor).toHaveAttribute('data-theme', 'vs-dark');
  });

  it('shows the name, asset version and creation time without offering to edit them', async () => {
    http.on('GET', '/asset/authz.rego', { body: [anAsset({ version: 2, createdAt: '2026-03-04T05:06:07.000Z' })] });

    openAsset();

    expect(await screen.findByRole('heading', { name: 'authz.rego' })).toBeInTheDocument();
    expect(screen.getByText('Asset version').nextElementSibling).toHaveTextContent('2');
    expect(screen.getByText('Created').nextElementSibling).toHaveTextContent(new Date('2026-03-04T05:06:07.000Z').toLocaleString());

    for (const label of ['Name', 'Asset version', 'Created']) {
      expect(screen.queryByRole('textbox', { name: label })).not.toBeInTheDocument();
    }
  });

  it('marks an asset that targets no environment', async () => {
    http.on('GET', '/asset/authz.rego', { body: [anAsset({ environment: [] })] });

    openAsset();

    expect(await screen.findByText('No targeted environments — this asset reaches no bundle.')).toBeInTheDocument();
    for (const environment of ['np', 'stage', 'prod']) {
      expect(screen.getByRole('checkbox', { name: environment })).not.toBeChecked();
    }
  });

  it('opens content that is not valid text read-only, and says why', async () => {
    http.on('GET', '/asset/authz.rego', { body: [anAsset({ value: invalidTextValue })] });

    openAsset();

    expect(await screen.findByText('Opened read-only')).toBeInTheDocument();
    expect(screen.getByTestId('monaco-editor')).toHaveAttribute('readonly');
  });

  it('says so when the name matches no asset, since the api answers with an empty list', async () => {
    http.on('GET', '/asset/missing.rego', { body: [] });

    openAsset('missing.rego');

    expect(await screen.findByText('No asset named missing.rego')).toBeInTheDocument();
  });

  it('exposes a diff mode taking an original and a modified side', async () => {
    renderWithProviders(<AssetDiffEditor original="package authz" modified="package authz.v2" language={REGO_LANGUAGE_ID} />);

    const diff = await screen.findByTestId('monaco-diff-editor');
    expect(diff).toHaveAttribute('data-language', REGO_LANGUAGE_ID);
    expect(within(diff).getByTestId('diff-original')).toHaveTextContent('package authz');
    expect(within(diff).getByTestId('diff-modified')).toHaveTextContent('package authz.v2');
  });

  it('leaves the existing flat routes alone', async () => {
    http.on('GET', '/domain', { body: { items: [{ name: 'example.com' }], total: 1 } });

    renderRoutes(appRoutes, '/domains');

    expect(await screen.findByRole('heading', { name: 'Domains' })).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('example.com')).toBeInTheDocument();
  });
});

describe('a render error inside a route', () => {
  it('lands on the application error page rather than the router default', async () => {
    const Boom = () => {
      throw new Error('the page fell over');
    };
    const [root, ...rest] = appRoutes;
    const routes = [{ ...root!, children: [...(root!.children ?? []), { path: 'boom', element: <Boom /> }] }, ...rest];

    renderRoutes(routes, '/boom');

    expect(await screen.findByText('Application Error')).toBeInTheDocument();
    expect(screen.getByText('the page fell over')).toBeInTheDocument();
  });
});
