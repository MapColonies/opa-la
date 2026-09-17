import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { appRoutes } from '../../src/routes';
import { anAsset, encodeText } from '../asset-fixtures';
import { http } from '../http-stub';
import { renderRoutes } from '../render';

const threeVersions = [
  anAsset({ name: 'authz.rego', version: 1, value: encodeText('package authz\n') }),
  anAsset({ name: 'authz.rego', version: 3, value: encodeText('package authz\n\n# latest\n') }),
  anAsset({ name: 'authz.rego', version: 2, value: encodeText('package authz\n\n# middle\n') }),
];

/**
 * Two asset versions targeting different environments, which is what makes "latest" and
 * "in use" come apart: prod builds from asset version 2, np still builds from 1.
 */
const splitAcrossEnvironments = [
  anAsset({ name: 'authz.rego', version: 2, environment: ['prod'], value: encodeText('for prod\n') }),
  anAsset({ name: 'authz.rego', version: 1, environment: ['np'], value: encodeText('for np\n') }),
];

const openAsset = (search = '') => renderRoutes(appRoutes, `/assets/authz.rego${search}`);

const versionSelect = () => screen.getByRole('combobox', { name: /Asset version/ });

describe('the asset version dropdown', () => {
  it('lists every asset version returned, latest first and marked as such', async () => {
    http.on('GET', '/asset/authz.rego', { body: threeVersions });

    openAsset();
    await screen.findByTestId('monaco-editor');

    await userEvent.click(versionSelect());

    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['3 (latest)', '2', '1']);
  });

  it('renders without fault when the api returns a single asset version, as it does today', async () => {
    http.on('GET', '/asset/authz.rego', { body: [anAsset({ name: 'authz.rego', version: 1 })] });

    openAsset();
    await screen.findByTestId('monaco-editor');

    expect(versionSelect()).toHaveTextContent('1 (latest)');
  });

  it('opens a non-latest asset version read-only, behind a banner saying so', async () => {
    http.on('GET', '/asset/authz.rego', { body: threeVersions });

    openAsset('?version=2');

    expect(await screen.findByText('Asset version 2 is not the latest')).toBeInTheDocument();
    expect(screen.getByText(/Latest is asset version 3/)).toBeInTheDocument();
    expect(screen.getByTestId('monaco-editor')).toHaveValue('package authz\n\n# middle\n');
    expect(screen.getByTestId('monaco-editor')).toHaveAttribute('readonly');
    expect(screen.queryByRole('button', { name: /^Save/ })).not.toBeInTheDocument();
  });

  it('offers a route back to latest, which is editable again', async () => {
    http.on('GET', '/asset/authz.rego', { body: threeVersions });

    const { router } = openAsset('?version=1');
    await screen.findByText('Asset version 1 is not the latest');

    await userEvent.click(screen.getByRole('link', { name: 'Go to latest' }));

    await waitFor(() => expect(router.state.location.search).toBe(''));
    expect(screen.getByTestId('monaco-editor')).toHaveValue('package authz\n\n# latest\n');

    // Latest opens read-only like any other asset, but this one can be taken into edit mode.
    expect(screen.getByTestId('monaco-editor')).toHaveAttribute('readonly');
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByTestId('monaco-editor')).not.toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('reaches a non-latest asset version through the dropdown', async () => {
    http.on('GET', '/asset/authz.rego', { body: threeVersions });

    const { router } = openAsset();
    await screen.findByTestId('monaco-editor');

    await userEvent.click(versionSelect());
    await userEvent.click(await screen.findByRole('option', { name: '2' }));

    await waitFor(() => expect(router.state.location.search).toBe('?version=2'));
    expect(await screen.findByText('Asset version 2 is not the latest')).toBeInTheDocument();
  });

  it('compares a non-latest asset version against latest, older on the left', async () => {
    http.on('GET', '/asset/authz.rego', { body: threeVersions });

    openAsset('?version=2');
    await screen.findByText('Asset version 2 is not the latest');

    await userEvent.click(screen.getByRole('button', { name: 'Compare with latest' }));

    const diff = screen.getByTestId('monaco-diff-editor');
    expect(within(diff).getByTestId('diff-original')).toHaveTextContent('# middle');
    expect(within(diff).getByTestId('diff-modified')).toHaveTextContent('# latest');
  });

  it('guards unsaved edits when the dropdown would switch asset version', async () => {
    http.on('GET', '/asset/authz.rego', { body: threeVersions });

    openAsset();
    await screen.findByTestId('monaco-editor');
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByTestId('monaco-editor'), { target: { value: 'package authz\n\n# mine\n' } });

    await userEvent.click(versionSelect());
    await userEvent.click(await screen.findByRole('option', { name: '1' }));

    expect(await screen.findByRole('dialog')).toHaveTextContent('Leave without saving?');
  });

  it('marks a non-latest asset version that an environment still builds from', async () => {
    http.on('GET', '/asset/authz.rego', { body: splitAcrossEnvironments });

    openAsset();
    await screen.findByTestId('monaco-editor');

    await userEvent.click(versionSelect());

    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['2 (latest)', '1 (in use: np)']);
  });

  it('leaves an asset version no environment builds from unmarked', async () => {
    http.on('GET', '/asset/authz.rego', { body: threeVersions });

    openAsset();
    await screen.findByTestId('monaco-editor');

    await userEvent.click(versionSelect());

    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['3 (latest)', '2', '1']);
  });

  it('says which environments the latest asset version is the one in use for', async () => {
    http.on('GET', '/asset/authz.rego', { body: splitAcrossEnvironments });

    openAsset();
    await screen.findByTestId('monaco-editor');

    // Latest targets prod only, so prod is all it is in use for — np is still on 1.
    expect(screen.getByText('In use: prod')).toBeInTheDocument();
  });

  it('calls a non-latest asset version both out of date and in use, when it is both', async () => {
    http.on('GET', '/asset/authz.rego', { body: splitAcrossEnvironments });

    openAsset('?version=1');

    expect(await screen.findByText('Asset version 1 is not the latest')).toBeInTheDocument();
    expect(screen.getByText('It is still in use for np.')).toBeInTheDocument();
    expect(screen.getByText(/Latest is asset version 2/)).toBeInTheDocument();
    expect(screen.getByText('In use: np')).toBeInTheDocument();
    expect(screen.getByTestId('monaco-editor')).toHaveAttribute('readonly');
  });

  it('says nothing about being in use for an asset version that is only history', async () => {
    http.on('GET', '/asset/authz.rego', { body: threeVersions });

    openAsset('?version=2');

    expect(await screen.findByText('Asset version 2 is not the latest')).toBeInTheDocument();
    expect(screen.queryByText(/still in use/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^In use:/)).not.toBeInTheDocument();
  });

  it('falls back to latest when the url names an asset version that does not exist', async () => {
    http.on('GET', '/asset/authz.rego', { body: threeVersions });

    openAsset('?version=99');

    expect(await screen.findByTestId('monaco-editor')).toHaveValue('package authz\n\n# latest\n');
    expect(screen.queryByText(/is not the latest/)).not.toBeInTheDocument();
  });
});
