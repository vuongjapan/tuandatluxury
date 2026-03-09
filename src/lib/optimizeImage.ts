/**
 * Optimize Supabase Storage image URLs.
 * Returns original public URL (render/image transforms require Pro plan).
 * Falls back to placeholder if URL is empty.
 */
export function optimizeImageUrl(
  url: string | null | undefined,
  _options: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!url) return '/placeholder.svg';
  return url;
}

/**
 * Generate srcSet for responsive images (no-op without Pro plan transforms).
 */
export function getResponsiveSrcSet(
  url: string | null | undefined,
  _widths: number[] = [320, 640, 960, 1280],
  _quality = 75
): string {
  if (!url) return '';
  return '';
}
