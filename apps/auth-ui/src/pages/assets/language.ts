import type { components } from 'auth-openapi';
import { REGO_LANGUAGE_ID } from '../../lib/monaco/language-ids';

type AssetType = components['schemas']['assetType'];

export const PLAIN_TEXT_LANGUAGE_ID = 'plaintext';

const BY_EXTENSION: Record<string, string> = {
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
};

/**
 * POLICY and TEST are Rego. DATA and TEST_DATA are data documents whose format the api
 * does not record, so the asset name's extension decides, falling back to plain text.
 *
 * The TEST_DATA mapping is inferred — it is the one asset type with no documentation in
 * the domain package.
 */
export const resolveEditorLanguage = (type: AssetType, name: string): string => {
  if (type === 'POLICY' || type === 'TEST') return REGO_LANGUAGE_ID;

  const extension = /\.([^.]+)$/.exec(name.toLowerCase())?.[1];
  return (extension && BY_EXTENSION[extension]) ?? PLAIN_TEXT_LANGUAGE_ID;
};
