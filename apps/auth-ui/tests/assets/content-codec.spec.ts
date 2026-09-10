import { describe, expect, it } from 'vitest';
import { MAX_ENCODED_BYTES, MAX_RAW_BYTES, decodeAssetContent, encodeAssetContent, estimateEncodedSize, isOverSizeLimit } from '@/lib/asset-content';

/** Base64 for bytes the codec never produces itself, so a decode failure can be provoked. */
function base64OfBytes(bytes: number[]): string {
  return btoa(String.fromCharCode(...bytes));
}

const HEBREW = 'package אבטחה\n# הרשאות למשתמש\nallow if input.משתמש == "דוד"\n';
const EMOJI = 'status: 🎉 done 👩‍👩‍👦 family 🇮🇱 flag';

describe('asset content round trip', () => {
  it.each([
    ['ascii', 'package authz\n\ndefault allow := false\n'],
    ['hebrew', HEBREW],
    ['emoji built from surrogate pairs', EMOJI],
    ['mixed crlf and lf line endings', 'first\r\nsecond\nthird\r\n\nfifth\r\n'],
    ['empty content', ''],
    ['a single newline', '\n'],
  ])('leaves %s unchanged', (_name, text) => {
    const decoded = decodeAssetContent(encodeAssetContent(text));

    expect(decoded.text).toBe(text);
    expect(decoded.isValidText).toBe(true);
  });

  it('leaves content over 1 MB unchanged', () => {
    const text = 'allow if input.action == "read"\n'.repeat(40_000);
    expect(text.length).toBeGreaterThan(1024 * 1024);

    const decoded = decodeAssetContent(encodeAssetContent(text));

    expect(decoded.isValidText).toBe(true);
    expect(decoded.text).toBe(text);
  });

  it('leaves multi-byte content spanning a chunk boundary unchanged', () => {
    // Hebrew is two bytes per character, so this crosses the 8192-byte chunk boundary mid-character.
    const text = 'שלום'.repeat(4096);

    expect(decodeAssetContent(encodeAssetContent(text)).text).toBe(text);
  });
});

describe('decoding bytes that are not valid text', () => {
  it('flags a lone continuation byte and still returns displayable text', () => {
    const decoded = decodeAssetContent(base64OfBytes([0x80]));

    expect(decoded.isValidText).toBe(false);
    expect(decoded.text).toBe('�');
  });

  it('flags a truncated multi-byte sequence', () => {
    // The first two bytes of a three-byte sequence, with the third missing.
    const decoded = decodeAssetContent(base64OfBytes([0xe0, 0xa4]));

    expect(decoded.isValidText).toBe(false);
  });

  it('flags binary content while keeping the readable parts', () => {
    const decoded = decodeAssetContent(base64OfBytes([0x50, 0x4b, 0x03, 0x04, 0xff, 0xfe, 0x00, 0x41]));

    expect(decoded.isValidText).toBe(false);
    expect(decoded.text).toContain('PK');
  });

  it('reports valid text as valid', () => {
    expect(decodeAssetContent(encodeAssetContent(HEBREW)).isValidText).toBe(true);
  });
});

describe('encoding large input', () => {
  it('does not exceed the argument limit on a multi-megabyte string', () => {
    const text = 'x'.repeat(5 * 1024 * 1024);

    expect(() => encodeAssetContent(text)).not.toThrow();
  });

  it('produces a payload a lenient decode reads back', () => {
    const text = `${'a'.repeat(3 * 1024 * 1024)}שלום`;

    expect(decodeAssetContent(encodeAssetContent(text)).text).toBe(text);
  });
});

describe('estimated encoded size', () => {
  it.each([
    ['empty content', ''],
    ['ascii', 'package authz'],
    ['ascii one byte past a 3-byte group', 'abcd'],
    ['ascii two bytes past a 3-byte group', 'abcde'],
    ['hebrew', HEBREW],
    ['emoji built from surrogate pairs', EMOJI],
    ['a lone surrogate', '\uD83D'],
    ['mixed line endings', 'first\r\nsecond\n'],
  ])('matches the real encoded length for %s', (_name, text) => {
    expect(estimateEncodedSize(text)).toBe(encodeAssetContent(text).length);
  });

  it('matches the real encoded length for content over 1 MB', () => {
    const text = `${'שלום עולם\n'.repeat(60_000)}🎉`;

    expect(estimateEncodedSize(text)).toBe(encodeAssetContent(text).length);
  });
});

describe('the size limit', () => {
  it('derives a raw ceiling that fills the body limit exactly', () => {
    expect(MAX_RAW_BYTES).toBeLessThan(MAX_ENCODED_BYTES);
    expect(estimateEncodedSize('a'.repeat(MAX_RAW_BYTES))).toBe(MAX_ENCODED_BYTES);
  });

  it('accepts content at the raw ceiling and rejects content past it', () => {
    expect(isOverSizeLimit('a'.repeat(MAX_RAW_BYTES))).toBe(false);
    expect(isOverSizeLimit('a'.repeat(MAX_RAW_BYTES + 1))).toBe(true);
  });

  it('counts multi-byte characters by their bytes, not their length', () => {
    // Two bytes each, so half as many characters reach the same ceiling.
    expect(isOverSizeLimit('ש'.repeat(MAX_RAW_BYTES / 2))).toBe(false);
    expect(isOverSizeLimit('ש'.repeat(MAX_RAW_BYTES / 2 + 1))).toBe(true);
  });

  it('accepts everyday content', () => {
    expect(isOverSizeLimit(HEBREW)).toBe(false);
  });
});
