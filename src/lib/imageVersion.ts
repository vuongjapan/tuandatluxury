/**
 * Image cache-busting helper.
 * Appends a version query so browsers re-fetch images after login/logout
 * or any time we want to invalidate stale cached assets.
 *
 * The version is initialized once per page load and stored on `window`.
 * Call `bumpImageVersion()` after auth changes to invalidate cached images.
 */

declare global {
  interface Window {
    __IMG_VER__?: number;
  }
}

function getVersion(): number {
  if (typeof window === 'undefined') return 1;
  if (!window.__IMG_VER__) {
    const stored = Number(localStorage.getItem('__img_ver__'));
    window.__IMG_VER__ = Number.isFinite(stored) && stored > 0 ? stored : Date.now();
  }
  return window.__IMG_VER__!;
}

/** Append a `?v=` cache-busting param to remote URLs (skips local /assets and data: URIs). */
export function withImageVersion(url: string | null | undefined): string {
  if (!url) return '/placeholder.svg';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  // Local imports already get a hashed filename from Vite — no need to bust.
  if (url.startsWith('/assets/') || url.startsWith('/placeholder')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${getVersion()}`;
}

/** Refresh the version (call after login/logout). */
export function bumpImageVersion() {
  if (typeof window === 'undefined') return;
  const v = Date.now();
  window.__IMG_VER__ = v;
  try { localStorage.setItem('__img_ver__', String(v)); } catch {}
}
