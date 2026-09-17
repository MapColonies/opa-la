/**
 * Conversion between the api's base64 representation of an asset's content and the text an editor shows.
 *
 * Pure by design: no react, no app imports, so the rules live in one place instead of being hand-rolled by each page.
 */

/** The api rejects json bodies larger than this, so an encoded payload above it can never be saved. */
export const MAX_ENCODED_BYTES = 1024 * 1024;

/**
 * The raw byte ceiling that base64 inflation implies: every 3 raw bytes become 4 encoded ones, so only three quarters
 * of the body limit is available to the content itself. Derived rather than written out, so the two stay in step.
 */
export const MAX_RAW_BYTES = Math.floor(MAX_ENCODED_BYTES / 4) * 3;

/** `String.fromCharCode` takes its bytes as arguments, and engines cap how many a call may receive. */
const BINARY_STRING_CHUNK_SIZE = 8192;

/** UTF-8 encodes a code point in one to four bytes, split at these boundaries. */
const TWO_BYTE_BOUNDARY = 0x80;
const THREE_BYTE_BOUNDARY = 0x800;
const FOUR_BYTE_BOUNDARY = 0x10000;

export interface DecodedAssetContent {
  /** The content as text. Lossy — with replacement characters in place of the offending bytes — when `isValidText` is false. */
  text: string;
  /**
   * False when the bytes are not valid UTF-8. Callers open such content read-only: re-encoding the lossy text would
   * write the replacement characters back over the original bytes and corrupt the asset.
   */
  isValidText: boolean;
}

/** Decodes an asset's base64 content into the text an editor shows, reporting whether the bytes were valid text. */
export function decodeAssetContent(base64: string): DecodedAssetContent {
  const bytes = base64ToBytes(base64);

  // Not even base64. Nothing can be shown, and re-encoding an empty buffer over it would
  // be the same corruption the flag exists to prevent.
  if (bytes === null) return { text: '', isValidText: false };

  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), isValidText: true };
  } catch {
    // Not text. Decode again leniently so the caller still has something to display.
    return { text: new TextDecoder('utf-8').decode(bytes), isValidText: false };
  }
}

/** Encodes an editor's text back into the base64 content the api expects. */
export function encodeAssetContent(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text));
}

/**
 * The number of bytes the encoded payload would occupy, without performing the encode. Lets a page warn about the body
 * limit on every keystroke without allocating a base64 copy of the content each time.
 */
export function estimateEncodedSize(text: string): number {
  return Math.ceil(utf8ByteLength(text) / 3) * 4;
}

/** Whether encoding this text would produce a payload the api's body limit rejects. */
export function isOverSizeLimit(text: string): boolean {
  return estimateEncodedSize(text) > MAX_ENCODED_BYTES;
}

/** Null when the string is not base64 at all, which `atob` reports by throwing. */
function base64ToBytes(base64: string): Uint8Array | null {
  try {
    return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';

  // Chunked because the whole array spread into one `String.fromCharCode` call blows the argument limit, which large
  // assets reach long before the api's body limit does.
  for (let offset = 0; offset < bytes.length; offset += BINARY_STRING_CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + BINARY_STRING_CHUNK_SIZE));
  }

  return btoa(binary);
}

function utf8ByteLength(text: string): number {
  let bytes = 0;

  for (const character of text) {
    const codePoint = character.codePointAt(0) ?? 0;

    if (codePoint < TWO_BYTE_BOUNDARY) {
      bytes += 1;
    } else if (codePoint < THREE_BYTE_BOUNDARY) {
      bytes += 2;
    } else if (codePoint < FOUR_BYTE_BOUNDARY) {
      // Lone surrogates land here, and the encoder replaces each with U+FFFD — also three bytes.
      bytes += 3;
    } else {
      bytes += 4;
    }
  }

  return bytes;
}
