import type { components } from 'auth-openapi';

type Asset = components['schemas']['asset'];
type AssetType = components['schemas']['assetType'];
type Environment = components['schemas']['environment'];

export const ASSET_TYPES: AssetType[] = ['POLICY', 'TEST', 'DATA', 'TEST_DATA'];
export const ENVIRONMENTS: Environment[] = ['np', 'stage', 'prod'];

/** Everything an author may change. Name, asset version and creation time are absent on purpose. */
export interface AssetDraft {
  content: string;
  type: AssetType;
  uri: string;
  environment: Environment[];
  isTemplate: boolean;
}

/**
 * The shared asset schema marks creation time both required and read-only, so the
 * generated request type demands a field the server rejects. This is the body the
 * server actually wants. The schema gap is recorded in the spec's Further Notes.
 */
export type AssetUpsertBody = Omit<Asset, 'createdAt'>;

export const draftOf = (asset: Asset, content: string): AssetDraft => ({
  content,
  type: asset.type,
  uri: asset.uri,
  environment: [...asset.environment],
  isTemplate: asset.isTemplate,
});

export const sameDraft = (left: AssetDraft, right: AssetDraft): boolean =>
  left.content === right.content &&
  left.type === right.type &&
  left.uri === right.uri &&
  left.isTemplate === right.isTemplate &&
  sameEnvironments(left.environment, right.environment);

const sameEnvironments = (left: Environment[], right: Environment[]): boolean =>
  left.length === right.length && [...left].sort().join() === [...right].sort().join();

export const isDirty = (draft: AssetDraft, asset: Asset, storedContent: string): boolean =>
  draft.content !== storedContent ||
  draft.type !== asset.type ||
  draft.uri !== asset.uri ||
  draft.isTemplate !== asset.isTemplate ||
  !sameEnvironments(draft.environment, asset.environment);

export interface FieldChange {
  label: string;
  before: string;
  after: string;
}

/** The metadata half of a review: content gets its own diff editor, so this covers the rest. */
export const changedFields = (draft: AssetDraft, asset: Asset): FieldChange[] => {
  const changes: FieldChange[] = [];

  if (draft.type !== asset.type) changes.push({ label: 'Type', before: asset.type, after: draft.type });
  if (draft.uri !== asset.uri) changes.push({ label: 'URI', before: asset.uri, after: draft.uri });
  if (!sameEnvironments(draft.environment, asset.environment)) {
    changes.push({
      label: 'Environments',
      before: describeEnvironments(asset.environment),
      after: describeEnvironments(draft.environment),
    });
  }
  if (draft.isTemplate !== asset.isTemplate) {
    changes.push({ label: 'Template', before: asset.isTemplate ? 'Yes' : 'No', after: draft.isTemplate ? 'Yes' : 'No' });
  }

  return changes;
};

const describeEnvironments = (environment: Environment[]): string => [...environment].sort().join(', ') || '(none)';
