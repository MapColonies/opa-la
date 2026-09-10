/**
 * A leading slash is fine: the bundle build joins the uri onto the bundle's base
 * directory with a join that treats it as relative, and the existing fixtures use one.
 * A parent-directory segment or a backslash is not — either escapes the bundle
 * directory. The server does not check this, so the check here is a usability aid
 * rather than a fix; the gap is recorded in the spec's Further Notes.
 */
export const validateUri = (uri: string): string | null => {
  if (uri.trim() === '') return 'A uri is required.';
  if (uri.includes('\\')) return 'A uri cannot contain a backslash.';
  if (uri.split('/').includes('..')) return 'A uri cannot contain a parent-directory segment.';
  return null;
};
