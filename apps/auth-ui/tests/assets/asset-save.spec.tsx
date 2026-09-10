import { createEvent, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { REGO_LANGUAGE_ID } from '@/lib/monaco/language-ids';
import { decodeAssetContent } from '@/lib/asset-content';
import { appRoutes } from '../../src/routes';
import { anAsset, encodeText } from '../asset-fixtures';
import { http } from '../http-stub';
import { renderRoutes } from '../render';

const stored = anAsset({ name: 'authz.rego', version: 3, uri: '/policies/authz.rego', value: encodeText('package authz\n') });

const openAsset = () => renderRoutes(appRoutes, '/assets/authz.rego');

const stubAsset = (asset = stored) => http.on('GET', '/asset/authz.rego', { body: [asset] });
const stubSave = (response: { status?: number; body?: unknown } = { body: stored }) => http.on('POST', '/asset', response);

const editor = () => screen.getByTestId('monaco-editor');
const setContent = (text: string) => fireEvent.change(editor(), { target: { value: text } });
const saveButton = () => screen.getByRole('button', { name: /Save/ });
const savedBody = () => http.lastRequestFor('POST', '/asset')?.body as Record<string, unknown> | undefined;

describe('editing an asset', () => {
  it('offers nothing to save until something changes', async () => {
    stubAsset();

    openAsset();
    await screen.findByTestId('monaco-editor');

    expect(saveButton()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Review changes' })).toBeDisabled();

    setContent('package authz.v2\n');

    expect(saveButton()).toBeEnabled();
  });

  it('makes content, type, uri, environments and the template flag editable, and the identity read-only', async () => {
    stubAsset();

    openAsset();
    await screen.findByTestId('monaco-editor');

    expect(editor()).not.toHaveAttribute('readonly');
    expect(screen.getByRole('combobox', { name: /Asset type/ })).toBeEnabled();
    expect(screen.getByRole('textbox', { name: 'URI' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'np' })).toBeEnabled();
    expect(screen.getByRole('switch', { name: 'Template asset' })).toBeEnabled();

    expect(screen.queryByRole('textbox', { name: 'Name' })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Asset version' })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Created' })).not.toBeInTheDocument();
  });

  it('switches the editor language the moment the type changes, and warns the content will not follow', async () => {
    stubAsset(anAsset({ name: 'authz.rego', type: 'POLICY' }));

    openAsset();
    await screen.findByTestId('monaco-editor');
    expect(editor()).toHaveAttribute('data-language', REGO_LANGUAGE_ID);

    await userEvent.click(screen.getByRole('combobox', { name: /Asset type/ }));
    await userEvent.click(await screen.findByRole('option', { name: 'DATA' }));

    expect(editor()).toHaveAttribute('data-language', 'plaintext');
    expect(screen.getByText('Asset type changed to DATA')).toBeInTheDocument();
  });

  it('accepts a uri of / and a leading slash', async () => {
    stubAsset();

    openAsset();
    await screen.findByTestId('monaco-editor');

    fireEvent.change(screen.getByRole('textbox', { name: 'URI' }), { target: { value: '/' } });
    expect(screen.queryByText(/cannot contain/)).not.toBeInTheDocument();
    expect(saveButton()).toBeEnabled();

    fireEvent.change(screen.getByRole('textbox', { name: 'URI' }), { target: { value: '/policies/nested/authz.rego' } });
    expect(saveButton()).toBeEnabled();
  });

  it.each([
    ['/policies/../../etc/passwd', 'A uri cannot contain a parent-directory segment.'],
    ['policies\\authz.rego', 'A uri cannot contain a backslash.'],
    ['', 'A uri is required.'],
  ])('rejects the uri %s before any request leaves the application', async (uri, message) => {
    stubAsset();
    stubSave();

    openAsset();
    await screen.findByTestId('monaco-editor');

    setContent('package authz.v2\n');
    fireEvent.change(screen.getByRole('textbox', { name: 'URI' }), { target: { value: uri } });

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();

    await userEvent.click(saveButton());
    expect(http.requestsFor('POST', '/asset')).toHaveLength(0);
  });

  it('saves an empty set of targeted environments', async () => {
    stubAsset(anAsset({ name: 'authz.rego', version: 3, environment: ['np'] }));
    stubSave();

    openAsset();
    await screen.findByTestId('monaco-editor');

    await userEvent.click(screen.getByRole('checkbox', { name: 'np' }));
    await userEvent.click(saveButton());

    await waitFor(() => expect(savedBody()?.['environment']).toEqual([]));
  });

  it('shows a diff of the working content against the stored content before saving', async () => {
    stubAsset();

    openAsset();
    await screen.findByTestId('monaco-editor');
    setContent('package authz.v2\n');

    await userEvent.click(screen.getByRole('button', { name: 'Review changes' }));

    const diff = screen.getByTestId('monaco-diff-editor');
    expect(within(diff).getByTestId('diff-original')).toHaveTextContent('package authz');
    expect(within(diff).getByTestId('diff-modified')).toHaveTextContent('package authz.v2');
  });

  it('posts the asset version it loaded and omits the read-only creation time', async () => {
    stubAsset();
    stubSave();

    openAsset();
    await screen.findByTestId('monaco-editor');
    setContent('package authz.v2\n');

    await userEvent.click(saveButton());

    await waitFor(() => expect(http.requestsFor('POST', '/asset')).toHaveLength(1));
    const body = savedBody()!;
    expect(body['version']).toBe(3);
    expect(body).not.toHaveProperty('createdAt');
    expect(body['name']).toBe('authz.rego');
    expect(body['uri']).toBe('/policies/authz.rego');
  });

  it('carries non-ascii content through a save unchanged', async () => {
    const content = 'package authz\n\n# בדיקה — 🎉 emoji\nallow := true\n';
    stubAsset();
    stubSave();

    openAsset();
    await screen.findByTestId('monaco-editor');
    setContent(content);

    await userEvent.click(saveButton());

    await waitFor(() => expect(http.requestsFor('POST', '/asset')).toHaveLength(1));
    expect(decodeAssetContent(savedBody()!['value'] as string)).toEqual({ text: content, isValidText: true });
  });

  it('saves from the keyboard, and swallows the browser default', async () => {
    stubAsset();
    stubSave();

    openAsset();
    await screen.findByTestId('monaco-editor');
    setContent('package authz.v2\n');

    const keyDown = createEvent.keyDown(editor(), { key: 's', ctrlKey: true });
    fireEvent(editor(), keyDown);

    expect(keyDown.defaultPrevented).toBe(true);
    await waitFor(() => expect(http.requestsFor('POST', '/asset')).toHaveLength(1));
  });

  it('confirms a save and leaves the list showing the change on return', async () => {
    let currentVersion = 3;
    http.on('GET', '/asset', () => ({ body: [anAsset({ name: 'authz.rego', version: currentVersion })] }));
    http.on('GET', '/asset/authz.rego', () => ({
      body: [anAsset({ name: 'authz.rego', version: currentVersion, value: encodeText('package authz\n') })],
    }));
    http.on('POST', '/asset', () => {
      currentVersion += 1;
      return { body: anAsset({ name: 'authz.rego', version: currentVersion }) };
    });

    renderRoutes(appRoutes, '/assets');
    await userEvent.click(await screen.findByRole('link', { name: 'authz.rego' }));
    await screen.findByTestId('monaco-editor');

    setContent('package authz.v2\n');
    await userEvent.click(saveButton());

    expect(await screen.findByText('Saved authz.rego')).toBeInTheDocument();

    // Both queries are invalidated, so this page refetches straight away...
    await waitFor(() => expect(screen.getByText('Asset version').nextElementSibling).toHaveTextContent('4'));

    // ...and the list is refetched rather than served stale on return.
    await userEvent.click(screen.getByRole('link', { name: 'Back to assets' }));
    const row = within(await screen.findByRole('table')).getAllByRole('row')[1]!;
    await waitFor(() => expect(within(row).getByText('4')).toBeInTheDocument());
  });

  it('reports a failed save without discarding the working content', async () => {
    stubAsset();
    stubSave({ status: 500, body: { message: 'the site is unreachable' } });

    openAsset();
    await screen.findByTestId('monaco-editor');
    setContent('package authz.v2\n');

    await userEvent.click(saveButton());

    expect(await screen.findByText('Save failed')).toBeInTheDocument();
    expect(editor()).toHaveValue('package authz.v2\n');
  });
});
