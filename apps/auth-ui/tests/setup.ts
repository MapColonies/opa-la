import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { http } from './http-stub';

// Installed here, at setup-file scope, because the shared api client resolves its
// base url at module load behind a top-level await on /config.json. Any page module
// imported before this point would resolve the fallback url and hit the network.
http.install();

// jsdom implements neither, and both are read while the ui mounts.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    public observe(): void {}
    public unobserve(): void {}
    public disconnect(): void {}
  };
}

// The editor library probes the clipboard capability at import time.
if (!document.queryCommandSupported) {
  document.queryCommandSupported = () => false;
  document.execCommand = () => false;
}

// Radix measures these on any popover-backed control; jsdom leaves them undefined.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}

beforeEach(() => {
  http.reset();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});
