import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { appRoutes } from '../../src/routes';
import { aBundle } from '../bundle-fixtures';
import { http } from '../http-stub';
import { renderRoutes } from '../render';

const openBundles = (search = '') => renderRoutes(appRoutes, `/bundles${search}`);

describe('bundles list', () => {
  it('appends a Bundles entry to the sidebar after Assets, leaving the others in place', async () => {
    http.on('GET', '/bundle', { body: [] });

    openBundles();

    const nav = await screen.findByRole('navigation');
    const entries = within(nav)
      .getAllByRole('link')
      .map((link) => link.textContent);
    expect(entries).toEqual(['Clients', 'Connections', 'Domains', 'Assets', 'Bundles', 'JWT Inspector', 'OPA Validator']);
  });

  it('renders a table fetched from GET /bundle with no query parameters', async () => {
    http.on('GET', '/bundle', { body: [aBundle()] });

    openBundles();

    expect(await screen.findByText('rev-1')).toBeInTheDocument();
    expect(http.lastRequestFor('GET', '/bundle')?.query.toString()).toBe('');
  });

  it('shows Created At, Environment, Revision, OPA Version, and Id columns in that order', async () => {
    http.on('GET', '/bundle', { body: [aBundle({ id: 42, revision: 'rev-7', opaVersion: '0.61.0', environment: 'prod' })] });

    openBundles();

    const table = await screen.findByRole('table');
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent);
    expect(headers).toEqual(['Created At', 'Environment', 'Revision', 'OPA Version', 'Id']);

    const row = within(table).getAllByRole('row')[1]!;
    expect(within(row).getByText('prod')).toBeInTheDocument();
    expect(within(row).getByText('rev-7')).toBeInTheDocument();
    expect(within(row).getByText('0.61.0')).toBeInTheDocument();
    expect(within(row).getByText('42')).toBeInTheDocument();
  });

  it('orders bundles with the newest createdAt first, regardless of the order returned by the server', async () => {
    http.on('GET', '/bundle', {
      body: [
        aBundle({ id: 1, createdAt: '2026-01-01T00:00:00.000Z' }),
        aBundle({ id: 3, createdAt: '2026-03-01T00:00:00.000Z' }),
        aBundle({ id: 2, createdAt: '2026-02-01T00:00:00.000Z' }),
      ],
    });

    openBundles();

    const table = await screen.findByRole('table');
    const idsInOrder = within(table)
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell').at(-1)?.textContent);
    expect(idsInOrder).toEqual(['3', '2', '1']);
  });

  it('shows a loading state while the request is in flight', async () => {
    http.on('GET', '/bundle', { body: [aBundle()], delayMs: 30 });

    openBundles();

    expect(await screen.findByRole('status', { name: 'Loading bundles' })).toBeInTheDocument();
  });

  it('shows an empty state when no bundles are returned', async () => {
    http.on('GET', '/bundle', { body: [] });

    openBundles();

    expect(await screen.findByText('No bundles found.')).toBeInTheDocument();
  });

  it('renders no create, edit, or delete controls', async () => {
    http.on('GET', '/bundle', { body: [aBundle()] });

    openBundles();
    await screen.findByText('rev-1');

    expect(screen.queryByRole('button', { name: /add bundle/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('sends no environment filter until one is chosen, then sends it as a one-element array', async () => {
    http.on('GET', '/bundle', { body: [aBundle()] });

    openBundles();
    await screen.findByText('rev-1');
    expect(http.lastRequestFor('GET', '/bundle')?.query.getAll('environment')).toEqual([]);

    await userEvent.click(screen.getByRole('combobox', { name: 'Environment' }));
    await userEvent.click(await screen.findByRole('option', { name: 'prod' }));

    await waitFor(() => expect(http.lastRequestFor('GET', '/bundle')?.query.getAll('environment')).toEqual(['prod']));
  });

  it('sends the createdAfter and createdBefore date filters to the server as full timestamps, covering the whole day picked', async () => {
    http.on('GET', '/bundle', { body: [aBundle()] });

    openBundles();
    await screen.findByText('rev-1');

    await userEvent.type(screen.getByLabelText('Created after'), '2026-01-01');
    await waitFor(() => expect(http.lastRequestFor('GET', '/bundle')?.query.get('createdAfter')).toBe('2026-01-01T00:00:00.000Z'));

    await userEvent.type(screen.getByLabelText('Created before'), '2026-06-01');
    await waitFor(() => expect(http.lastRequestFor('GET', '/bundle')?.query.get('createdBefore')).toBe('2026-06-01T23:59:59.999Z'));
  });

  it('combines the environment and date filters into a single request', async () => {
    http.on('GET', '/bundle', { body: [aBundle()] });

    openBundles('?environment=stage&createdAfter=2026-01-01&createdBefore=2026-06-01');
    await screen.findByText('rev-1');

    const request = http.lastRequestFor('GET', '/bundle');
    expect(request?.query.getAll('environment')).toEqual(['stage']);
    expect(request?.query.get('createdAfter')).toBe('2026-01-01T00:00:00.000Z');
    expect(request?.query.get('createdBefore')).toBe('2026-06-01T23:59:59.999Z');
  });

  it('reads the filters back out of the url on load, and restores them across a refresh', async () => {
    http.on('GET', '/bundle', { body: [aBundle()] });

    openBundles('?environment=prod&createdAfter=2026-01-01&createdBefore=2026-06-01');

    await screen.findByText('rev-1');
    expect(screen.getByRole('combobox', { name: 'Environment' })).toHaveTextContent('prod');
    expect(screen.getByLabelText('Created after')).toHaveValue('2026-01-01');
    expect(screen.getByLabelText('Created before')).toHaveValue('2026-06-01');
  });

  it('shows an empty state when the active filters match no bundles', async () => {
    http.on('GET', '/bundle', { body: [] });

    openBundles('?environment=prod');

    expect(await screen.findByText('No bundles found.')).toBeInTheDocument();
  });
});
