import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { appRoutes } from '../../src/routes';
import { API_ORIGIN, OTHER_SITE_ORIGINS, http, type RecordedRequest } from '../http-stub';
import { renderRoutes } from '../render';

const IN_USE = { message: 'domain is in use by connections' };

/** Serves the list from a mutable set, so a delete the stub accepts is gone on the next fetch. */
const stubDomains = (...names: string[]): Set<string> => {
  const domains = new Set(names);
  http.on('GET', '/domain', () => ({ body: { items: [...domains].map((name) => ({ name })), total: domains.size } }));
  return domains;
};

const deleteRequests = (name: string): RecordedRequest[] => http.requestsFor('DELETE', `/domain/${name}`);

const originOf = (request: RecordedRequest): string => new URL(request.url).origin;

const openDomains = () => renderRoutes(appRoutes, '/domains');

const rowFor = async (name: string): Promise<HTMLElement> => {
  const cell = await screen.findByRole('cell', { name });
  return cell.closest('tr')!;
};

const openDeleteFor = async (name: string): Promise<HTMLElement> => {
  await userEvent.click(within(await rowFor(name)).getByRole('button', { name: `Delete ${name}` }));
  return screen.findByRole('dialog');
};

describe('deleting a domain', () => {
  beforeEach(() => {
    // The current site, as the site switcher records it. The other two are the ones to send to.
    localStorage.setItem('selectedSite', 'local');
  });

  it('offers a Delete action on every row', async () => {
    stubDomains('avi', 'bar');

    openDomains();

    for (const name of ['avi', 'bar']) {
      expect(within(await rowFor(name)).getByRole('button', { name: `Delete ${name}` })).toBeInTheDocument();
    }
  });

  it('asks for confirmation, naming the domain and saying the delete is permanent', async () => {
    stubDomains('avi', 'bar');

    openDomains();
    const dialog = await openDeleteFor('bar');

    expect(within(dialog).getByRole('heading', { name: 'Delete Domain' })).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/bar/);
    expect(dialog).not.toHaveTextContent(/avi/);
    expect(dialog).toHaveTextContent(/permanent/i);
  });

  it('sends nothing when cancelled', async () => {
    stubDomains('avi');

    openDomains();
    const dialog = await openDeleteFor('avi');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(deleteRequests('avi')).toHaveLength(0);
  });

  it('sends the delete for that row to the current site when confirmed', async () => {
    stubDomains('avi', 'bar');
    http.on('DELETE', '/domain/bar', { status: 204 });

    openDomains();
    const dialog = await openDeleteFor('bar');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteRequests('bar')).toHaveLength(1));
    expect(originOf(deleteRequests('bar')[0]!)).toBe(API_ORIGIN);
    expect(deleteRequests('avi')).toHaveLength(0);
  });

  it('disables the delete button while the delete is in progress', async () => {
    stubDomains('avi');
    http.on('DELETE', '/domain/avi', { status: 204, delayMs: 50 });

    openDomains();
    const dialog = await openDeleteFor('avi');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(within(dialog).getByRole('button', { name: /Deleting/ })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('cannot be closed while the delete is sent to the other sites', async () => {
    stubDomains('avi');
    http.on('DELETE', '/domain/avi', (request) => (originOf(request) === API_ORIGIN ? { status: 204 } : { status: 204, delayMs: 200 }));

    openDomains();
    const dialog = await openDeleteFor('avi');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await userEvent.click(await within(dialog).findByRole('checkbox', { name: 'north' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete on Selected Sites' }));

    const [footerClose, cornerClose] = within(dialog).getAllByRole('button', { name: 'Close' });
    expect(footerClose).toBeDisabled();
    await userEvent.click(cornerClose!);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(await within(dialog).findByRole('listitem', { name: 'north' })).toHaveTextContent('Success');
  });

  it('removes the row once the list refetches, and offers to delete on the other sites', async () => {
    const domains = stubDomains('avi', 'bar');
    http.on('DELETE', '/domain/bar', () => {
      domains.delete('bar');
      return { status: 204 };
    });

    openDomains();
    const dialog = await openDeleteFor('bar');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await within(dialog).findByText(/deleted successfully on local/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('cell', { name: 'bar', hidden: true })).not.toBeInTheDocument());
    expect(screen.getByRole('cell', { name: 'avi', hidden: true })).toBeInTheDocument();

    expect(within(dialog).getByRole('checkbox', { name: 'north' })).toBeInTheDocument();
    expect(within(dialog).getByRole('checkbox', { name: 'south' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Delete on Selected Sites' })).toBeInTheDocument();
  });

  it.each([
    [409, IN_USE],
    [404, { message: 'domain not found' }],
  ])('shows the server message on a %i, stays on the confirmation, and offers no other sites', async (status, body) => {
    stubDomains('avi');
    http.on('DELETE', '/domain/avi', { status, body });

    openDomains();
    const dialog = await openDeleteFor('avi');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(body.message);
    expect(within(dialog).getByRole('button', { name: 'Delete' })).toBeEnabled();
    expect(within(dialog).queryByRole('checkbox')).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Delete on Selected Sites' })).not.toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'avi', hidden: true })).toBeInTheDocument();
  });

  it('sends the delete to each selected site and shows how each one went', async () => {
    stubDomains('avi');
    http.on('DELETE', '/domain/avi', (request) => (originOf(request) === OTHER_SITE_ORIGINS.south ? { status: 409, body: IN_USE } : { status: 204 }));

    openDomains();
    const dialog = await openDeleteFor('avi');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await userEvent.click(await within(dialog).findByRole('checkbox', { name: 'north' }));
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'south' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete on Selected Sites' }));

    const results = await within(dialog).findByRole('list', { name: 'Results' });
    expect(within(results).getByRole('listitem', { name: 'north' })).toHaveTextContent('Success');
    expect(within(results).getByRole('listitem', { name: 'south' })).toHaveTextContent(IN_USE.message);

    expect(deleteRequests('avi').map(originOf).sort()).toEqual([API_ORIGIN, OTHER_SITE_ORIGINS.north, OTHER_SITE_ORIGINS.south]);
    expect(await screen.findByText('Domain deleted on: north')).toBeInTheDocument();
    expect(await screen.findByText('Failed to delete domain on: south')).toBeInTheDocument();
  });

  it('sends nothing to the other sites when closed without choosing any', async () => {
    stubDomains('avi');
    http.on('DELETE', '/domain/avi', { status: 204 });

    openDomains();
    const dialog = await openDeleteFor('avi');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await within(dialog).findByRole('checkbox', { name: 'north' });
    // The footer's Close and the corner's both close it; the footer's comes first.
    await userEvent.click(within(dialog).getAllByRole('button', { name: 'Close' })[0]!);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(deleteRequests('avi').map(originOf)).toEqual([API_ORIGIN]);
  });

  it('treats the first site as the current one when no site was ever picked', async () => {
    localStorage.removeItem('selectedSite');
    stubDomains('avi');
    http.on('DELETE', '/domain/avi', { status: 204 });

    openDomains();
    const dialog = await openDeleteFor('avi');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await within(dialog).findByText(/deleted successfully on local/i)).toBeInTheDocument();
    expect(within(dialog).getByRole('checkbox', { name: 'north' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('checkbox', { name: 'local' })).not.toBeInTheDocument();
  });
});
