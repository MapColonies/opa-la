import type { components } from 'auth-openapi';
import { getFetchClient } from '../../fetch';
import type { AssetUpsertBody } from './draft';

type Asset = components['schemas']['asset'];

export const CONFLICT_STATUS = 409;
const NOT_FOUND_STATUS = 404;

/** A request on the save path the server refused. The status is what tells a conflict from anything else. */
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

/**
 * Whether an asset already exists under this name.
 *
 * A create cannot leave this to the server. `upsertAsset` refuses a post only when the
 * declared version is not the name's current maximum, so a post of asset version 1 for a
 * name already at version 1 — every asset that has never been edited — takes the update
 * branch instead: the stored content is replaced in place. There is no content history
 * and no delete, so what was overwritten is gone. `GET /asset/{assetName}` answers with
 * an empty list for an unknown name, which is what makes asking first possible.
 *
 * This is a check, not a lock. A name taken between the check and the post still lands on
 * the same overwrite, so the api's own refusal is the backstop, and the api gaining a
 * create that refuses a taken name is recorded in the spec's Further Notes.
 */
export const assetNameIsTaken = async (name: string): Promise<boolean> => {
  const { data, error, response } = await getFetchClient().GET('/asset/{assetName}', { params: { path: { assetName: name } } });

  // The schema declares a 404 here that the server does not emit today — it answers an
  // unknown name with an empty list. Should it ever start emitting one, that is the answer
  // to this question rather than a failure to get one: the name is free.
  if (response.status === NOT_FOUND_STATUS) return false;

  if (error !== undefined || data === undefined) {
    throw new SaveFailure(response.status, error?.message ?? `Could not check whether the name ${name} is already in use.`);
  }
  return data.length > 0;
};
