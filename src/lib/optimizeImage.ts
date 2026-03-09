/**
 * Optimize Supabase Storage image URLs with resize/quality transforms.
 * Works only with Supabase Storage URLs; returns original URL for others.
 */
export function optimizeImageUrl(
  url: string | null | undefined,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!url) return '/placeholder.svg';

  const { width, height, quality = 75 } = options;

  // Only transform Supabase Storage URLs
  if (!url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }

  // Use Supabase image transformation API
  // Convert: /storage/v1/object/public/ → /storage/v1/render/image/public/
  const renderUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );

  const params = new URLSearchParams();
  if (width) params.set('width', String(width));
  if (height) params.set('height', String(height));
  params.set('quality', String(quality));
  params.set('format', 'origin');

  return `${renderUrl}?${params.toString()}`;
}

/**
 * Generate srcSet for responsive images from Supabase Storage.
 */
export function getResponsiveSrcSet(
  url: string | null | undefined,
  widths: number[] = [320, 640, 960, 1280],
  quality = 75
): string {
  if (!url || !url.includes('supabase.co/storage/v1/object/public/')) {
    return '';
  }

  return widths
    .map(w => `${optimizeImageUrl(url, { width: w, quality })} ${w}w`)
    .join(', ');
}
