import { describe, expect, it } from 'vitest';
import { REGO_LANGUAGE_ID } from '@/lib/monaco/language-ids';
import { PLAIN_TEXT_LANGUAGE_ID, resolveEditorLanguage } from '@/pages/assets/language';

describe('editor language resolution', () => {
  it.each([
    ['POLICY', 'authz.rego', REGO_LANGUAGE_ID],
    ['POLICY', 'authz', REGO_LANGUAGE_ID],
    ['POLICY', 'authz.json', REGO_LANGUAGE_ID],
    ['TEST', 'authz_test.rego', REGO_LANGUAGE_ID],
    ['TEST', 'authz_test.yaml', REGO_LANGUAGE_ID],
  ] as const)('reads a %s named %s as rego whatever its extension', (type, name, expected) => {
    expect(resolveEditorLanguage(type, name)).toBe(expected);
  });

  it.each([
    ['DATA', 'clients.json', 'json'],
    ['DATA', 'clients.yaml', 'yaml'],
    ['DATA', 'clients.yml', 'yaml'],
    ['DATA', 'clients.JSON', 'json'],
    ['DATA', 'clients.txt', PLAIN_TEXT_LANGUAGE_ID],
    ['DATA', 'clients', PLAIN_TEXT_LANGUAGE_ID],
    ['DATA', 'clients.', PLAIN_TEXT_LANGUAGE_ID],
    ['DATA', 'archive.tar.gz', PLAIN_TEXT_LANGUAGE_ID],
    ['DATA', 'clients.backup.json', 'json'],
    ['TEST_DATA', 'fixtures.json', 'json'],
    ['TEST_DATA', 'fixtures.yaml', 'yaml'],
    ['TEST_DATA', 'fixtures', PLAIN_TEXT_LANGUAGE_ID],
  ] as const)('reads a %s named %s from its extension', (type, name, expected) => {
    expect(resolveEditorLanguage(type, name)).toBe(expected);
  });
});
