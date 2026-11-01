import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { appRoutes } from '../../src/routes';
import { API_ORIGIN, OTHER_SITE_ORIGINS, http, type RecordedRequest } from '../http-stub';
import { renderRoutes } from '../render';

const IN_USE = { message: 'client is in use by connections' };

const aClient = (name: string) => ({
  name,
  hebName: `heb-${name}`,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

/** Serves the list from a mutable set, so a delete the stub accepts is gone on the next fetch. */
const stubClients = (...names: string[]): Set<string> => {
  const clients = new Set(names);
  http.on('GET', '/client', () => ({ body: { items: [...clients].map(aClient), total: clients.size } }));
  return clients;
};

const deleteRequests = (name: string): RecordedRequest[] => http.requestsFor('DELETE', `/client/${name}`);

const originOf = (request: RecordedRequest): string => new URL(request.url).origin;

const openClients = () => renderRoutes(appRoutes, '/clients');

const rowFor = async (name: string): Promise<HTMLElement> => {
  const cell = await screen.findByRole('cell', { name });
  return cell.closest('tr')!;
};

const openDeleteFor = async (name: string): Promise<HTMLElement> => {
  await userEvent.click(within(await rowFor(name)).getByRole('button', { name: `Delete ${name}` }));
  return screen.findByRole('dialog');
};

describe('deleting a client', () => {
  beforeEach(() => {
    // The current site, as the site switcher records it. The other two are the ones to send to.
    localStorage.setItem('selectedSite', 'local');
  });

  it('offers a Delete action next to Edit on every row', async () => {
    stubClients('acme', 'globex');

    openClients();

    for (const name of ['acme', 'globex']) {
      const buttons = within(await rowFor(name))
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label'));
      expect(buttons).toEqual([`Edit ${name}`, `Delete ${name}`]);
    }
  });

  it('asks for confirmation, naming the client and saying the delete is permanent', async () => {
    stubClients('acme', 'globex');

    openClients();
    const dialog = await openDeleteFor('globex');

    expect(within(dialog).getByRole('heading', { name: 'Delete Client' })).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/globex/);
    expect(dialog).not.toHaveTextContent(/acme/);
    expect(dialog).toHaveTextContent(/permanent/i);
  });

  it('sends nothing when cancelled', async () => {
    stubClients('acme');

    openClients();
    const dialog = await openDeleteFor('acme');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(deleteRequests('acme')).toHaveLength(0);
  });

  it('removes the row once the list refetches, and offers to delete on the other sites', async () => {
    const clients = stubClients('acme', 'globex');
    http.on('DELETE', '/client/globex', () => {
      clients.delete('globex');
      return { status: 204 };
    });

    openClients();
    const dialog = await openDeleteFor('globex');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await within(dialog).findByText(/deleted successfully on local/i)).toBeInTheDocument();
    expect(deleteRequests('globex').map(originOf)).toEqual([API_ORIGIN]);
    expect(deleteRequests('acme')).toHaveLength(0);

    await waitFor(() => expect(screen.queryByRole('cell', { name: 'globex', hidden: true })).not.toBeInTheDocument());
    expect(screen.getByRole('cell', { name: 'acme', hidden: true })).toBeInTheDocument();

    expect(within(dialog).getByRole('checkbox', { name: 'north' })).toBeInTheDocument();
    expect(within(dialog).getByRole('checkbox', { name: 'south' })).toBeInTheDocument();
  });

  it.each([
    [409, IN_USE],
    [404, { message: 'client not found' }],
  ])('shows the server message on a %i, stays on the confirmation, and offers no other sites', async (status, body) => {
    stubClients('acme');
    http.on('DELETE', '/client/acme', { status, body });

    openClients();
    const dialog = await openDeleteFor('acme');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(body.message);
    expect(within(dialog).getByRole('button', { name: 'Delete' })).toBeEnabled();
    expect(within(dialog).queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'acme', hidden: true })).toBeInTheDocument();
  });

  it('sends the delete to each selected site and shows how each one went', async () => {
    stubClients('acme');
    http.on('DELETE', '/client/acme', (request) =>
      originOf(request) === OTHER_SITE_ORIGINS.south ? { status: 409, body: IN_USE } : { status: 204 }
    );

    openClients();
    const dialog = await openDeleteFor('acme');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await userEvent.click(await within(dialog).findByRole('checkbox', { name: 'north' }));
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'south' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete on Selected Sites' }));

    const results = await within(dialog).findByRole('list', { name: 'Results' });
    expect(within(results).getByRole('listitem', { name: 'north' })).toHaveTextContent('Success');
    expect(within(results).getByRole('listitem', { name: 'south' })).toHaveTextContent(IN_USE.message);

    expect(deleteRequests('acme').map(originOf).sort()).toEqual([API_ORIGIN, OTHER_SITE_ORIGINS.north, OTHER_SITE_ORIGINS.south]);
    expect(await screen.findByText('Client deleted on: north')).toBeInTheDocument();
    expect(await screen.findByText('Failed to delete client on: south')).toBeInTheDocument();
  });
});
