import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MAX_ENCODED_BYTES } from '@/lib/asset-content';
import { appRoutes } from '../../src/routes';
import { anAsset, encodeText } from '../asset-fixtures';
import { http } from '../http-stub';
import { renderRoutes } from '../render';

const openAsset = () => renderRoutes(appRoutes, '/assets/authz.rego');

const editor = () => screen.getByTestId('monaco-editor');
const setContent = (text: string) => fireEvent.change(editor(), { target: { value: text } });
const saveButton = () => screen.getByRole('button', { name: 'Save' });

/** An asset opens read-only, so every test that changes something starts here. */
const startEditing = async () => {
  await screen.findByTestId('monaco-editor');
  await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
};

/** Save asks before it writes; this is the whole way through. */
const saveAndConfirm = async () => {
  await userEvent.click(saveButton());
  await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }));
};

/** Raw text whose encoded size lands at the given fraction of the api's body limit. */
const contentSized = (fractionOfLimit: number) => 'a'.repeat(Math.round((MAX_ENCODED_BYTES * fractionOfLimit * 3) / 4));

describe('a stale save', () => {
  it('keeps the working content, refetches the stored content, and puts the two in the diff', async () => {
    let stored = anAsset({ name: 'authz.rego', version: 3, value: encodeText('package authz\n') });
    http.on('GET', '/asset/authz.rego', () => ({ body: [stored] }));
    http.on('POST', '/asset', () => {
      // Somebody else got there first, and the stored content moved on.
      stored = anAsset({ name: 'authz.rego', version: 4, value: encodeText('package authz\n\n# theirs\n') });
      return { status: 409, body: { message: 'version mismatch between database asset and given asset' } };
    });

    openAsset();
    await startEditing();
    setContent('package authz\n\n# mine\n');

    await saveAndConfirm();

    const diff = await screen.findByTestId('monaco-diff-editor');
    await waitFor(() => expect(within(diff).getByTestId('diff-original')).toHaveTextContent('# theirs'));
    expect(within(diff).getByTestId('diff-modified')).toHaveTextContent('# mine');
  });

  it('is worded as a stale asset version, not as a name already in use', async () => {
    http.on('GET', '/asset/authz.rego', { body: [anAsset({ name: 'authz.rego', version: 3 })] });
    http.on('POST', '/asset', { status: 409, body: { message: 'version mismatch between database asset and given asset' } });

    openAsset();
    await startEditing();
    setContent('package authz.v2\n');

    await saveAndConfirm();

    expect(await screen.findByText('Conflict: this asset moved on while you were editing')).toBeInTheDocument();
    expect(screen.getByText(/declared asset version 3/)).toBeInTheDocument();
    expect(screen.queryByText(/already in use/)).not.toBeInTheDocument();
  });
});

describe('navigating away', () => {
  it('asks for confirmation when there are unsaved edits, and stays put if the answer is no', async () => {
    http.on('GET', '/asset', { body: [] });
    http.on('GET', '/asset/authz.rego', { body: [anAsset({ name: 'authz.rego' })] });

    const { router } = openAsset();
    await startEditing();
    setContent('package authz.v2\n');

    await userEvent.click(screen.getByRole('link', { name: 'Clients' }));

    expect(await screen.findByRole('dialog')).toHaveTextContent('Leave without saving?');
    expect(router.state.location.pathname).toBe('/assets/authz.rego');

    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(router.state.location.pathname).toBe('/assets/authz.rego');
    expect(editor()).toHaveValue('package authz.v2\n');
  });

  it('lets the edits go once that is the answer', async () => {
    http.on('GET', '/asset', { body: [] });
    http.on('GET', '/asset/authz.rego', { body: [anAsset({ name: 'authz.rego' })] });

    const { router } = openAsset();
    await startEditing();
    setContent('package authz.v2\n');

    await userEvent.click(screen.getByRole('link', { name: 'Assets' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Discard changes' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/assets'));
  });

  it('does not ask when nothing is unsaved', async () => {
    http.on('GET', '/asset', { body: [] });
    http.on('GET', '/asset/authz.rego', { body: [anAsset({ name: 'authz.rego' })] });

    const { router } = openAsset();
    await screen.findByTestId('monaco-editor');

    await userEvent.click(screen.getByRole('link', { name: 'Assets' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/assets'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('content approaching the request size limit', () => {
  it('warns while a save is still possible', async () => {
    http.on('GET', '/asset/authz.rego', { body: [anAsset({ name: 'authz.rego' })] });

    openAsset();
    await startEditing();
    setContent(contentSized(0.95));

    expect(screen.getByText('Approaching the request size limit')).toBeInTheDocument();
    expect(saveButton()).toBeEnabled();
  });

  it('explains a refusal here rather than letting the server answer with one', async () => {
    http.on('GET', '/asset/authz.rego', { body: [anAsset({ name: 'authz.rego' })] });
    http.on('POST', '/asset', { body: anAsset() });

    openAsset();
    await startEditing();
    setContent(contentSized(1.05));

    expect(screen.getByText('Too large to save')).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();

    await userEvent.click(saveButton());
    expect(http.requestsFor('POST', '/asset')).toHaveLength(0);
  });

  it('says nothing about size for ordinary content', async () => {
    http.on('GET', '/asset/authz.rego', { body: [anAsset({ name: 'authz.rego' })] });

    openAsset();
    await startEditing();
    setContent('package authz.v2\n');

    expect(screen.queryByText(/request size limit/)).not.toBeInTheDocument();
    expect(screen.queryByText('Too large to save')).not.toBeInTheDocument();
  });
});
