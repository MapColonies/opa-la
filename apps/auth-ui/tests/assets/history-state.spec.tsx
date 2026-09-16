import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { appRoutes } from '../../src/routes';
import { http } from '../http-stub';
import { renderRoutes } from '../render';

/**
 * Not a test of the client, connection and domain pages, which this feature otherwise
 * leaves alone — a test of the one thing this feature took a dependency on.
 *
 * Those three pages write the url with `window.history.replaceState` directly rather than
 * through the router. Under the plain router that was harmless; the data router this
 * feature introduced keeps its own history index in that state and reads it on every push,
 * so replacing it with a fresh object leaves every entry pushed afterwards with an index of
 * `NaN` — the number `useBlocker`, the asset editor's unsaved-work guard, reads on a back
 * navigation.
 *
 * What is asserted below is narrower than that story: these tests render on a memory
 * router, which never writes `window.history` at all, so they prove only that writing the
 * url leaves whatever state was already there untouched. That is the whole of the fix, but
 * the consequence for the guard is a browser behaviour and is not covered here.
 */

/** Stands in for a history entry, shaped the way the data router writes one. */
const ROUTER_STATE = { usr: null, key: 'abcdefgh', idx: 3 };

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe.each([
  ['clients', '/clients', '/client'],
  ['connections', '/connections', '/connection'],
  ['domains', '/domains', '/domain'],
])('the %s page writing its filters to the url', (_name, path, endpoint) => {
  it("leaves the router's history state intact", async () => {
    http.on('GET', endpoint, { body: [] });
    window.history.replaceState(ROUTER_STATE, '', path);

    renderRoutes(appRoutes, path);
    await userEvent.type(await screen.findByRole('searchbox'), 'x');

    await waitFor(() => expect(window.location.search).toContain('name=x'), { timeout: 2000 });
    expect(window.history.state).toEqual(ROUTER_STATE);
  });
});
