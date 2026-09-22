import { screen, within } from '@testing-library/react';
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
});
