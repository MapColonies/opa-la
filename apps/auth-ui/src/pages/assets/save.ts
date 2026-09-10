import type { components } from 'auth-openapi';
import { getFetchClient } from '../../fetch';
import type { AssetUpsertBody } from './draft';

type Asset = components['schemas']['asset'];

export const CONFLICT_STATUS = 409;

/** A save the server refused. The status is what tells a conflict from anything else. */
export class SaveFailure extends Error {
  public constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

/**
 * Both create and edit post here. The query wrapper the other pages use does not
 * surface the response status, and telling a 409 from any other failure needs it, so
 * this goes through the shared fetch client directly.
 *
 * The cast is the one place the schema's read-only-yet-required creation time is
 * papered over; see `AssetUpsertBody`.
 */
export const saveAsset = async (body: AssetUpsertBody): Promise<Asset> => {
  const { data, error, response } = await getFetchClient().POST('/asset', { body: body as Asset });
  if (error !== undefined || data === undefined) {
    throw new SaveFailure(response.status, error?.message ?? 'The asset was not saved.');
  }
  return data;
};
