import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { decodeAssetContent, MAX_ENCODED_BYTES } from '@/lib/asset-content';
import { appRoutes } from '../../src/routes';
import { anAsset, stubCreating } from '../asset-fixtures';
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
    // The asset version is the api's to assign and is always 1 here, so the page does not
    // state it. It is stated on the page the create lands on, once it is a fact.
    expect(screen.queryByText(/asset version/i)).not.toBeInTheDocument();
    expect(nameField()).toHaveValue('');
    expect(screen.getByRole('combobox', { name: /Asset type/ })).toHaveTextContent('POLICY');
    expect(screen.getByRole('textbox', { name: 'URI' })).toHaveValue('/');
    expect(screen.getByRole('switch', { name: 'Template asset' })).not.toBeChecked();
    for (const environment of ['np', 'stage', 'prod']) {
      expect(screen.getByRole('checkbox', { name: environment })).not.toBeChecked();
    }
  });

  it('keeps the environments hint on its line when a box is ticked, so the controls do not move', async () => {
    const { container } = openCreate();
    await screen.findByRole('heading', { name: 'New asset' });

    const hint = container.querySelector('#asset-environments-hint');
    expect(hint).toHaveTextContent('No environments selected');

    await userEvent.click(screen.getByRole('checkbox', { name: 'np' }));

    // The same element, still holding its line. Only the words go away.
    expect(container.querySelector('#asset-environments-hint')).toBe(hint);
    expect(hint).not.toHaveTextContent('No environments selected');
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
    stubCreating(anAsset({ name: 'billing.rego', version: 1 }));

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
    // The backstop for a name taken between the check below and the post: the check sees
    // nothing, and the server refuses.
    http.on('GET', '/asset/authz.rego', { body: [] });
    http.on('POST', '/asset', { status: 409, body: { message: 'given asset version is not 1, when no asset already exists' } });

    openCreate();
    await screen.findByRole('heading', { name: 'New asset' });

    fireEvent.change(nameField(), { target: { value: 'authz.rego' } });
    await userEvent.click(createButton());

    expect(await screen.findByText(/The name authz.rego is already in use/)).toBeInTheDocument();
    expect(screen.queryByText(/stale/)).not.toBeInTheDocument();
    expect(screen.queryByText(/declared asset version/)).not.toBeInTheDocument();
  });

  it('refuses a name already in use rather than overwriting that asset', async () => {
    // The api reads a post of asset version 1 for a name already at version 1 as an update
    // and replaces the stored content in place, so nothing on the server refuses this.
    http.on('GET', '/asset/authz.rego', { body: [anAsset({ name: 'authz.rego', version: 1 })] });
    http.on('POST', '/asset', { status: 201, body: anAsset({ name: 'authz.rego', version: 2 }) });

    openCreate();
    await screen.findByRole('heading', { name: 'New asset' });

    fireEvent.change(nameField(), { target: { value: 'authz.rego' } });
    fireEvent.change(screen.getByTestId('monaco-editor'), { target: { value: 'package authz\n' } });
    await userEvent.click(createButton());

    expect(await screen.findByText(/The name authz.rego is already in use/)).toBeInTheDocument();
    expect(http.requestsFor('POST', '/asset')).toHaveLength(0);
  });

  it('checks the name it is about to take, not the one typed before it was trimmed', async () => {
    http.on('GET', '/asset/billing.rego', { body: [anAsset({ name: 'billing.rego', version: 1 })] });
    http.on('POST', '/asset', { status: 201, body: anAsset({ name: 'billing.rego', version: 2 }) });

    openCreate();
    await screen.findByRole('heading', { name: 'New asset' });

    fireEvent.change(nameField(), { target: { value: '  billing.rego  ' } });
    await userEvent.click(createButton());

    expect(await screen.findByText(/The name billing.rego is already in use/)).toBeInTheDocument();
    expect(http.requestsFor('POST', '/asset')).toHaveLength(0);
  });

  it('reads the declared 404 as a free name rather than as a failure to check', async () => {
    // The schema declares a 404 on the named-asset endpoint that the server does not emit
    // today. If it ever does, it answers the question rather than refusing to.
    http.on('GET', '/asset/billing.rego', { status: 404, body: { message: 'asset was not found in the database' } });
    http.on('POST', '/asset', { status: 201, body: anAsset({ name: 'billing.rego', version: 1 }) });

    openCreate();
    await screen.findByRole('heading', { name: 'New asset' });

    fireEvent.change(nameField(), { target: { value: 'billing.rego' } });
    await userEvent.click(createButton());

    await waitFor(() => expect(http.requestsFor('POST', '/asset')).toHaveLength(1));
    expect(createdBody()?.['name']).toBe('billing.rego');
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
