import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Editor } from '@monaco-editor/react';
import { $api } from '../../src/fetch';
import { API_ORIGIN, http } from '../http-stub';
import { renderRoutes, renderWithProviders } from '../render';

const Params = () => <p>{useParams().id}</p>;

const Assets = () => {
  const { data } = $api.useQuery('get', '/asset', { params: { query: { type: 'POLICY' } } });
  return (
    <ul>
      {data?.map((asset) => (
        <li key={asset.name}>{asset.name}</li>
      ))}
    </ul>
  );
};

describe('test harness', () => {
  it('serves requests from the stub and records method, path and query', async () => {
    http.on('GET', '/asset', {
      body: [{ name: 'authz.rego', value: '', uri: '/', type: 'POLICY', isTemplate: false, version: 1, environment: [], createdAt: '' }],
    });

    renderWithProviders(<Assets />);

    expect(await screen.findByText('authz.rego')).toBeInTheDocument();

    const request = http.lastRequestFor('GET', '/asset');
    expect(request?.method).toBe('GET');
    expect(request?.url.startsWith(API_ORIGIN)).toBe(true);
    expect(request?.query.get('type')).toBe('POLICY');
  });

  it('fails loudly on an unstubbed request rather than reaching the network', async () => {
    renderWithProviders(<Assets />);

    await waitFor(() => expect(http.requestsFor('GET', '/asset')).toHaveLength(1));
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('mounts real route objects on a data router, parameters and all', async () => {
    const routes = [{ path: 'thing/:id', element: <Params /> }];

    renderRoutes(routes, '/thing/authz.rego');

    expect(await screen.findByText('authz.rego')).toBeInTheDocument();
  });

  it('renders the editor as a text area that forwards content and changes', async () => {
    const Host = () => {
      const [value, setValue] = useState('package authz');
      return <Editor language="rego" value={value} onChange={(next) => setValue(next ?? '')} />;
    };

    renderWithProviders(<Host />);

    const editor = await screen.findByTestId('monaco-editor');
    expect(editor).toHaveValue('package authz');
    expect(editor).toHaveAttribute('data-language', 'rego');

    await userEvent.type(editor, '.main');
    expect(editor).toHaveValue('package authz.main');
  });
});
