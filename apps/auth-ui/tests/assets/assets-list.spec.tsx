import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { appRoutes } from '../../src/routes';
import { anAsset } from '../asset-fixtures';
import { http } from '../http-stub';
import { renderRoutes } from '../render';

const openAssets = (search = '') => renderRoutes(appRoutes, `/assets${search}`);

const rowsInBody = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);

describe('assets list', () => {
  it('appends an Assets entry to the sidebar after Domains, leaving the others in place', async () => {
    http.on('GET', '/asset', { body: [] });

    openAssets();

    const nav = await screen.findByRole('navigation');
    const entries = within(nav)
      .getAllByRole('link')
      .map((link) => link.textContent);
    expect(entries).toEqual(['Clients', 'Connections', 'Domains', 'Assets', 'JWT Inspector', 'OPA Validator']);
  });

  it('renders name, version, type, environments, the template flag and the uri', async () => {
    http.on('GET', '/asset', {
      body: [anAsset({ name: 'authz.rego', version: 4, type: 'POLICY', environment: ['np', 'prod'], isTemplate: true, uri: '/policies/authz.rego' })],
    });

    openAssets();

    const row = within(await screen.findByRole('table')).getAllByRole('row')[1]!;
    expect(within(row).getByText('authz.rego')).toBeInTheDocument();
    expect(within(row).getByText('4')).toBeInTheDocument();
    expect(within(row).getByText('POLICY')).toBeInTheDocument();
    expect(within(row).getByText('np')).toBeInTheDocument();
    expect(within(row).getByText('prod')).toBeInTheDocument();
    expect(within(row).getByText('Template')).toBeInTheDocument();
    expect(within(row).getByText('/policies/authz.rego')).toBeInTheDocument();
  });

  it('marks an asset that targets no environment', async () => {
    http.on('GET', '/asset', { body: [anAsset({ environment: [] })] });

    openAssets();

    expect(await screen.findByText('No environments')).toBeInTheDocument();
  });

  it('truncates the uri but keeps its full value reachable', async () => {
    const uri = '/policies/deeply/nested/directory/structure/authz.rego';
    http.on('GET', '/asset', { body: [anAsset({ uri })] });

    openAssets();

    const shown = await screen.findByText(uri);
    expect(shown).toHaveClass('truncate');
    expect(shown).toHaveAttribute('title', uri);
  });

  it('sends no environment filter until one is chosen, then sends it as a one-element array', async () => {
    http.on('GET', '/asset', { body: [anAsset()] });

    openAssets();
    await screen.findByText('authz.rego');
    expect(http.lastRequestFor('GET', '/asset')?.query.getAll('environment')).toEqual([]);

    await userEvent.click(screen.getByRole('combobox', { name: 'Targeted environment' }));
    await userEvent.click(await screen.findByRole('option', { name: 'prod' }));

    await waitFor(() => expect(http.lastRequestFor('GET', '/asset')?.query.getAll('environment')).toEqual(['prod']));
  });

  it('sends the asset type and template filters to the server', async () => {
    http.on('GET', '/asset', { body: [anAsset()] });

    openAssets('?type=DATA&template=true');

    await screen.findByText('authz.rego');
    const request = http.lastRequestFor('GET', '/asset');
    expect(request?.query.get('type')).toBe('DATA');
    expect(request?.query.get('isTemplate')).toBe('true');
  });

  it('filters by name client-side, only once typing settles, and returns to the first page', async () => {
    http.on('GET', '/asset', { body: [anAsset({ name: 'authz.rego' }), anAsset({ name: 'billing.rego' })] });

    const { router } = openAssets('?pageSize=1&page=2');
    await screen.findByText('billing.rego');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search by asset name' }), 'billing');

    // Still the page-two slice: the term has not settled yet, so no filtering has happened.
    expect(screen.getByText('billing.rego')).toBeInTheDocument();

    await waitFor(() => expect(router.state.location.search).toContain('name=billing'), { timeout: 2000 });
    expect(router.state.location.search).not.toContain('page=2');
    expect(rowsInBody()).toHaveLength(1);
    expect(screen.getByText('billing.rego')).toBeInTheDocument();
    expect(http.requestsFor('GET', '/asset')).toHaveLength(1);
  });

  it('toggles sort per column and slices the filtered rows into pages', async () => {
    http.on('GET', '/asset', { body: [anAsset({ name: 'b.rego' }), anAsset({ name: 'a.rego' }), anAsset({ name: 'c.rego' })] });

    const { router } = openAssets('?pageSize=2');
    await screen.findByText('a.rego');

    const nameHeader = screen.getByRole('button', { name: /^Name/ });
    await userEvent.click(nameHeader);
    await waitFor(() => expect(router.state.location.search).toContain('sort=name%3Aasc'));
    expect(rowsInBody().map((row) => row.textContent?.split('1')[0])).toEqual(['a.rego', 'b.rego']);

    await userEvent.click(nameHeader);
    await waitFor(() => expect(router.state.location.search).toContain('sort=name%3Adesc'));
    expect(rowsInBody()).toHaveLength(2);
    expect(screen.getByText('c.rego')).toBeInTheDocument();
    expect(screen.queryByText('a.rego')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(rowsInBody()).toHaveLength(1));
    expect(screen.getByText('a.rego')).toBeInTheDocument();

    await userEvent.click(nameHeader);
    await waitFor(() => expect(router.state.location.search).not.toContain('sort='));
  });

  it('ignores a filter the url invents rather than sending it to the server', async () => {
    http.on('GET', '/asset', { body: [anAsset()] });

    openAssets('?environment=nowhere&type=NONSENSE');

    await screen.findByText('authz.rego');
    const request = http.lastRequestFor('GET', '/asset');
    expect(request?.query.getAll('environment')).toEqual([]);
    expect(request?.query.get('type')).toBeNull();
    expect(screen.getByRole('combobox', { name: 'Targeted environment' })).toHaveTextContent('All targeted environments');
  });

  it('falls back to the first page when the url asks for one that is not a number', async () => {
    http.on('GET', '/asset', { body: [anAsset({ name: 'a.rego' }), anAsset({ name: 'b.rego' })] });

    openAssets('?page=abc&pageSize=-1');

    expect(await screen.findByText('a.rego')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    expect(rowsInBody()).toHaveLength(2);
  });

  it('reads filters, sort and page back out of the url', async () => {
    http.on('GET', '/asset', { body: [anAsset({ name: 'a.rego' }), anAsset({ name: 'b.rego' })] });

    openAssets('?environment=stage&type=TEST&template=false&sort=name%3Adesc&page=2&pageSize=1');

    await screen.findByText('a.rego');
    expect(screen.getByRole('combobox', { name: 'Targeted environment' })).toHaveTextContent('stage');
    expect(screen.getByRole('combobox', { name: 'Asset type' })).toHaveTextContent('TEST');
    expect(screen.getByRole('combobox', { name: 'Template' })).toHaveTextContent('Non-templates only');
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(rowsInBody()).toHaveLength(1);
  });

  it('distinguishes loading, an empty result and a retryable failure', async () => {
    let attempt = 0;
    http.on('GET', '/asset', () => {
      attempt += 1;
      return attempt === 1 ? { status: 500, body: { message: 'site unreachable' }, delayMs: 20 } : { body: [] };
    });

    openAssets();

    expect(await screen.findByRole('status', { name: 'Loading assets' })).toBeInTheDocument();

    expect(await screen.findByText('Failed to load assets')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('No assets found.')).toBeInTheDocument();
  });
});
