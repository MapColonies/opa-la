import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { appRoutes } from '../../src/routes';
import { anAsset, encodeText } from '../asset-fixtures';
import { http } from '../http-stub';
import { renderRoutes } from '../render';

/** Base64 of bytes that are not valid utf-8. */
const invalidTextValue = btoa(String.fromCharCode(0xff, 0xfe, 0x41));

const stored = anAsset({ name: 'authz.rego', version: 3, value: encodeText('package authz\n') });

const openAsset = () => renderRoutes(appRoutes, '/assets/authz.rego');
const stubAsset = (asset = stored) => http.on('GET', '/asset/authz.rego', { body: [asset] });

const editor = () => screen.getByTestId('monaco-editor');
const setContent = (text: string) => fireEvent.change(editor(), { target: { value: text } });

const startEditing = async () => {
  await screen.findByTestId('monaco-editor');
  await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
};

describe('read mode', () => {
  it('opens an asset for reading, with one way into editing it', async () => {
    stubAsset();

    openAsset();
    await screen.findByTestId('monaco-editor');

    expect(editor()).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Review changes' })).not.toBeInTheDocument();
  });

  it('locks the metadata too, and unlocks all of it together', async () => {
    stubAsset();

    openAsset();
    await screen.findByTestId('monaco-editor');

    expect(screen.getByRole('combobox', { name: /Asset type/ })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'URI' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'np' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'Template asset' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(editor()).not.toHaveAttribute('readonly');
    expect(screen.getByRole('combobox', { name: /Asset type/ })).toBeEnabled();
    expect(screen.getByRole('textbox', { name: 'URI' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'np' })).toBeEnabled();
    expect(screen.getByRole('switch', { name: 'Template asset' })).toBeEnabled();
  });

  it('offers no way in at all when the content is not valid text', async () => {
    stubAsset(anAsset({ name: 'authz.rego', value: invalidTextValue }));

    openAsset();
    await screen.findByTestId('monaco-editor');

    expect(await screen.findByText('Opened read-only')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
  });
});

describe('leaving edit mode', () => {
  it('goes straight back to reading when nothing was touched', async () => {
    stubAsset();

    openAsset();
    await startEditing();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(editor()).toHaveAttribute('readonly');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('asks before throwing edits away, and keeps them if the answer is no', async () => {
    stubAsset();

    openAsset();
    await startEditing();
    setContent('package authz.v2\n');

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Discard your changes?');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Keep editing' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(editor()).toHaveValue('package authz.v2\n');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('puts the stored content back once that is the answer', async () => {
    stubAsset();

    openAsset();
    await startEditing();
    setContent('package authz.v2\n');
    await userEvent.click(screen.getByRole('checkbox', { name: 'stage' }));

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Discard changes' }));

    await waitFor(() => expect(editor()).toHaveValue('package authz\n'));
    expect(editor()).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'stage' })).not.toBeChecked();
  });
});

describe('confirming a save', () => {
  it('asks before writing, and warns about the bundles rather than about lost history', async () => {
    stubAsset(anAsset({ name: 'authz.rego', version: 3, environment: ['np', 'prod'], value: encodeText('package authz\n') }));
    http.on('POST', '/asset', { body: stored });

    openAsset();
    await startEditing();
    setContent('package authz.v2\n');

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Save changes to authz.rego?');
    expect(dialog).toHaveTextContent('This writes asset version 4. np, prod build their next bundle from it, in place of asset version 3.');
    // The asset version is the history, so there is nothing here about content being lost.
    expect(dialog).not.toHaveTextContent(/history|brought back/);
    expect(http.requestsFor('POST', '/asset')).toHaveLength(0);
  });

  it('says a save changes no bundle when the asset targets nothing', async () => {
    stubAsset(anAsset({ name: 'authz.rego', version: 3, environment: [], value: encodeText('package authz\n') }));
    http.on('POST', '/asset', { body: stored });

    openAsset();
    await startEditing();
    setContent('package authz.v2\n');

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('dialog')).toHaveTextContent('It targets no environment, so no bundle changes until one is chosen.');
  });

  it('sends nothing and stays in edit mode when the answer is no', async () => {
    stubAsset();
    http.on('POST', '/asset', { body: stored });

    openAsset();
    await startEditing();
    setContent('package authz.v2\n');

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Keep editing' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(http.requestsFor('POST', '/asset')).toHaveLength(0);
    expect(editor()).toHaveValue('package authz.v2\n');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });
});

describe('proof that a write landed', () => {
  it('closes edit mode and names the asset version the save produced', async () => {
    let current = stored;
    http.on('GET', '/asset/authz.rego', () => ({ body: [current] }));
    http.on('POST', '/asset', (request) => {
      current = { ...(request.body as typeof current), createdAt: current.createdAt, version: current.version + 1 };
      return { body: current };
    });

    openAsset();
    await startEditing();
    setContent('package authz.v2\n');

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Saved — authz.rego is now asset version 4')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(editor()).toHaveAttribute('readonly');
  });

  it('says so on the page a create lands on, which otherwise looks untouched', async () => {
    http.on('POST', '/asset', { status: 201, body: anAsset({ name: 'billing.rego', version: 1 }) });
    http.on('GET', '/asset/billing.rego', { body: [anAsset({ name: 'billing.rego', version: 1 })] });

    renderRoutes(appRoutes, '/assets/new');
    await screen.findByRole('heading', { name: 'New asset' });

    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'billing.rego' } });
    await userEvent.click(screen.getByRole('button', { name: /Create/ }));

    expect(await screen.findByText('Created — billing.rego is now asset version 1')).toBeInTheDocument();
  });

  it('drops the notice again as soon as editing starts', async () => {
    http.on('POST', '/asset', { status: 201, body: anAsset({ name: 'billing.rego', version: 1 }) });
    http.on('GET', '/asset/billing.rego', { body: [anAsset({ name: 'billing.rego', version: 1 })] });

    renderRoutes(appRoutes, '/assets/new');
    await screen.findByRole('heading', { name: 'New asset' });

    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'billing.rego' } });
    await userEvent.click(screen.getByRole('button', { name: /Create/ }));
    await screen.findByText('Created — billing.rego is now asset version 1');

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));

    await waitFor(() => expect(screen.queryByText(/is now asset version/)).not.toBeInTheDocument());
  });
});
