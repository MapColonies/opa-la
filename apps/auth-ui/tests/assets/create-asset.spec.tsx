import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { decodeAssetContent } from '@/lib/asset-content';
import { appRoutes } from '../../src/routes';
import { MAX_ENCODED_BYTES } from '@/lib/asset-content';
import { anAsset } from '../asset-fixtures';
import { http } from '../http-stub';
import { renderRoutes } from '../render';

const openCreate = () => renderRoutes(appRoutes, '/assets/new');

const createButton = () => screen.getByRole('button', { name: /Create/ });
const nameField = () => screen.getByRole('textbox', { name: 'Name' });
const createdBody = () => http.lastRequestFor('POST', '/asset')?.body as Record<string, unknown> | undefined;

describe('creating an asset', () => {
  it('is reachable from the assets list', async () => {
    http.on('GET', '/asset', { body: [] });

    const { router } = renderRoutes(appRoutes, '/assets');

    await userEvent.click(await screen.findByRole('link', { name: /Add asset/ }));

    expect(router.state.location.pathname).toBe('/assets/new');
    expect(await screen.findByRole('heading', { name: 'New asset' })).toBeInTheDocument();
  });

  it('opens as a full page with the defaults filled in', async () => {
    openCreate();

    expect(await screen.findByRole('heading', { name: 'New asset' })).toBeInTheDocument();
    expect(screen.getByText('Asset version').nextElementSibling).toHaveTextContent('1');
    expect(nameField()).toHaveValue('');
    expect(screen.getByRole('combobox', { name: /Asset type/ })).toHaveTextContent('POLICY');
    expect(screen.getByRole('textbox', { name: 'URI' })).toHaveValue('/');
    expect(screen.getByRole('switch', { name: 'Template asset' })).not.toBeChecked();
    for (const environment of ['np', 'stage', 'prod']) {
      expect(screen.getByRole('checkbox', { name: environment })).not.toBeChecked();
    }
  });

  it.each([
    ['', 'A name is required.'],
    ['ab', 'A name must be at least three characters.'],
  ])('rejects the name %s before any request leaves the application', async (name, message) => {
    http.on('POST', '/asset', { body: anAsset() });

    openCreate();
    await screen.findByRole('heading', { name: 'New asset' });

    if (name !== '') fireEvent.change(nameField(), { target: { value: name } });
    await userEvent.click(createButton());

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(http.requestsFor('POST', '/asset')).toHaveLength(0);
  });

  it('posts asset version 1 and lands in the editor for what it just created', async () => {
    http.on('POST', '/asset', { status: 201, body: anAsset({ name: 'billing.rego', version: 1 }) });
    http.on('GET', '/asset/billing.rego', { body: [anAsset({ name: 'billing.rego', version: 1 })] });

    const { router } = openCreate();
    await screen.findByRole('heading', { name: 'New asset' });

    fireEvent.change(nameField(), { target: { value: 'billing.rego' } });
    fireEvent.change(screen.getByTestId('monaco-editor'), { target: { value: 'package billing\n' } });
    await userEvent.click(createButton());

    await waitFor(() => expect(router.state.location.pathname).toBe('/assets/billing.rego'));

    const body = createdBody()!;
    expect(body['version']).toBe(1);
    expect(body['name']).toBe('billing.rego');
    expect(body['uri']).toBe('/');
    expect(body['type']).toBe('POLICY');
    expect(body['isTemplate']).toBe(false);
    expect(body['environment']).toEqual([]);
    expect(body).not.toHaveProperty('createdAt');
    expect(decodeAssetContent(body['value'] as string).text).toBe('package billing\n');

    expect(await screen.findByRole('heading', { name: 'billing.rego' })).toBeInTheDocument();
  });

  it('reads a conflict as a name already in use, not as a stale asset version', async () => {
    http.on('POST', '/asset', { status: 409, body: { message: 'given asset version is not 1, when no asset already exists' } });

    openCreate();
    await screen.findByRole('heading', { name: 'New asset' });

    fireEvent.change(nameField(), { target: { value: 'authz.rego' } });
    await userEvent.click(createButton());

    expect(await screen.findByText(/The name authz.rego is already in use/)).toBeInTheDocument();
    expect(screen.queryByText(/stale/)).not.toBeInTheDocument();
    expect(screen.queryByText(/declared asset version/)).not.toBeInTheDocument();
  });

  it('guards a half-written asset against a navigation away', async () => {
    http.on('GET', '/asset', { body: [] });

    const { router } = openCreate();
    await screen.findByRole('heading', { name: 'New asset' });

    fireEvent.change(nameField(), { target: { value: 'billing.rego' } });
    await userEvent.click(screen.getByRole('link', { name: 'Assets' }));

    expect(await screen.findByRole('dialog')).toHaveTextContent('Leave without saving?');
    expect(router.state.location.pathname).toBe('/assets/new');
  });

  it('does not guard an untouched create page', async () => {
    http.on('GET', '/asset', { body: [] });

    const { router } = openCreate();
    await screen.findByRole('heading', { name: 'New asset' });

    await userEvent.click(screen.getByRole('link', { name: 'Assets' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/assets'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('refuses content over the request size limit here rather than at the server', async () => {
    http.on('POST', '/asset', { body: anAsset() });

    openCreate();
    await screen.findByRole('heading', { name: 'New asset' });

    fireEvent.change(nameField(), { target: { value: 'billing.rego' } });
    fireEvent.change(screen.getByTestId('monaco-editor'), { target: { value: 'a'.repeat((MAX_ENCODED_BYTES * 3) / 4 + 100) } });

    expect(screen.getByText('Too large to save')).toBeInTheDocument();
    expect(createButton()).toBeDisabled();

    await userEvent.click(createButton());
    expect(http.requestsFor('POST', '/asset')).toHaveLength(0);
  });

  it('rejects a traversing uri before any request, as the asset page does', async () => {
    http.on('POST', '/asset', { body: anAsset() });

    openCreate();
    await screen.findByRole('heading', { name: 'New asset' });

    fireEvent.change(nameField(), { target: { value: 'billing.rego' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'URI' }), { target: { value: '../escape' } });
    await userEvent.click(createButton());

    expect(screen.getByText('A uri cannot contain a parent-directory segment.')).toBeInTheDocument();
    expect(http.requestsFor('POST', '/asset')).toHaveLength(0);
  });
});
