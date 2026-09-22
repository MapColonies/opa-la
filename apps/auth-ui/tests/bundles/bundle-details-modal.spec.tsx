import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { appRoutes } from '../../src/routes';
import { aBundle } from '../bundle-fixtures';
import { http } from '../http-stub';
import { renderRoutes } from '../render';

const openBundles = (search = '') => renderRoutes(appRoutes, `/bundles${search}`);

describe('bundle details modal', () => {
  it('opens from a row and shows the hash, keyVersion, assets, connections and metadata', async () => {
    http.on('GET', '/bundle', {
      body: [
        aBundle({
          id: 7,
          hash: 'sha256:deadbeef',
          keyVersion: 3,
          assets: [{ name: 'authz.rego', version: 2 }],
          connections: [{ name: 'billing-connection', version: 5 }],
          metadata: { builtBy: 'ci', commit: 'abc123' },
        }),
      ],
    });

    openBundles();
    await userEvent.click(await screen.findByText('rev-1'));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('sha256:deadbeef')).toBeInTheDocument();
    expect(within(dialog).getByText('3')).toBeInTheDocument();
    expect(within(dialog).getByText('authz.rego')).toBeInTheDocument();
    expect(within(dialog).getByText('v2')).toBeInTheDocument();
    expect(within(dialog).getByText('billing-connection')).toBeInTheDocument();
    expect(within(dialog).getByText('v5')).toBeInTheDocument();
    expect(within(dialog).getByText(/"builtBy": "ci"/)).toBeInTheDocument();
    expect(within(dialog).getByText(/"commit": "abc123"/)).toBeInTheDocument();
  });

  it('shows a placeholder when a bundle has no assets or connections', async () => {
    http.on('GET', '/bundle', { body: [aBundle({ assets: [], connections: [] })] });

    openBundles();
    await userEvent.click(await screen.findByText('rev-1'));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('No assets')).toBeInTheDocument();
    expect(within(dialog).getByText('No connections')).toBeInTheDocument();
  });

  it('makes no additional request when opening the modal', async () => {
    http.on('GET', '/bundle', { body: [aBundle()] });

    openBundles();
    await userEvent.click(await screen.findByText('rev-1'));

    await screen.findByRole('dialog');
    expect(http.requestsFor('GET', '/bundle')).toHaveLength(1);
  });

  it('is read-only, with no edit or delete controls', async () => {
    http.on('GET', '/bundle', { body: [aBundle()] });

    openBundles();
    await userEvent.click(await screen.findByText('rev-1'));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('closes the modal without affecting the underlying list', async () => {
    http.on('GET', '/bundle', { body: [aBundle()] });

    openBundles();
    await userEvent.click(await screen.findByText('rev-1'));
    await screen.findByRole('dialog');

    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    await screen.findByText('rev-1');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
