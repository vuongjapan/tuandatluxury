/**
 * Optimize Supabase Storage image URLs by rewriting public object URLs
 * to the Storage Image Transform render endpoint with width/quality/format.
 *
 * If the project's plan does not support image transforms, requests may 400.
 * SmartImage handles that by falling back to the original URL on error.
 *
 * Pass-through for non-Supabase URLs and local /assets paths.
 */

const OBJECT_PUBLIC = '/storage/v1/object/public/';
const RENDER_PUBLIC = '/storage/v1/render/image/public/';

// Allow disabling at runtime if transforms aren't supported on this project.
let transformsDisabled =
  typeof window !== 'undefined' &&
  window.localStorage?.getItem('__img_transforms_disabled__') === '1';

export function disableImageTransforms() {
  transformsDisabled = true;
  try { window.localStorage?.setItem('__img_transforms_disabled__', '1'); } catch {}
}

export interface ImageOpts {
  width?: number;
  height?: number;
  quality?: number;
  /** 'origin' returns the original format. */
  format?: 'webp' | 'origin';
  /** 'cover' | 'contain' | 'fill' */
  resize?: 'cover' | 'contain' | 'fill';
}

export function optimizeImageUrl(
  url: string | null | undefined,
  opts: ImageOpts = {}
): string {
  if (!url) return '/placeholder.svg';
  if (transformsDisabled) return url;
  if (!url.includes(OBJECT_PUBLIC)) return url;
  // SVGs and GIFs: skip transforms
  if (/\.(svg|gif)(\?|$)/i.test(url)) return url;

  const [base, query] = url.split('?');
  const transformed = base.replace(OBJECT_PUBLIC, RENDER_PUBLIC);

  const params = new URLSearchParams(query || '');
  if (opts.width) params.set('width', String(Math.round(opts.width)));
  if (opts.height) params.set('height', String(Math.round(opts.height)));
  params.set('quality', String(opts.quality ?? 75));
  params.set('format', opts.format ?? 'origin'); // 'origin' auto-serves WebP when supported
  if (opts.resize) params.set('resize', opts.resize);

  const qs = params.toString();
  return qs ? `${transformed}?${qs}` : transformed;
}

export function getResponsiveSrcSet(
  url: string | null | undefined,
  widths: number[] = [400, 800, 1200, 1600],
  quality = 75
): string {
  if (!url) return '';
  return widths
    .map((w) => `${optimizeImageUrl(url, { width: w, quality })} ${w}w`)
    .join(', ');
}
