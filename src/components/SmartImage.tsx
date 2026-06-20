import { useState, memo, ImgHTMLAttributes, useRef } from 'react';
import { withImageVersion } from '@/lib/imageVersion';
import { optimizeImageUrl, disableImageTransforms } from '@/lib/optimizeImage';
import { cn } from '@/lib/utils';

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onLoad' | 'onError'> {
  src: string | null | undefined;
  alt: string;
  wrapperClassName?: string;
  fit?: 'cover' | 'contain';
  /** Skip cache-busting (e.g. for static bundled assets). */
  skipVersion?: boolean;
  /** Eager-load critical above-the-fold images. */
  eager?: boolean;
  /** Target render width in CSS px – used for Supabase image transform. */
  width?: number;
  /** Transform quality (default 75). */
  quality?: number;
}

/**
 * Image with skeleton-loading placeholder, fade-in on load, lazy-loading by
 * default, Supabase storage image transforms, and cache-bust versioning.
 *
 * On error: retry once with the original (non-transformed) URL before showing
 * a placeholder. If transforms appear unsupported, future calls skip them.
 */
const SmartImage = memo(function SmartImage({
  src, alt, wrapperClassName, className, fit = 'cover',
  skipVersion = false, eager = false, width, quality, ...rest
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const fallbackTried = useRef(false);

  const baseSrc = skipVersion ? (src || '/placeholder.svg') : withImageVersion(src);
  const initialSrc = errored
    ? '/placeholder.svg'
    : (width ? optimizeImageUrl(baseSrc, { width, quality }) : baseSrc);

  return (
    <div className={cn('relative overflow-hidden bg-muted', wrapperClassName)}>
      {!loaded && (
        <>
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-muted via-secondary to-muted" />
          <div
            aria-hidden
            className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        </>
      )}
      <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
      <img
        {...rest}
        src={initialSrc}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : 'auto' as any}
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          // Retry once with the original URL (transforms may be disabled on plan).
          if (!fallbackTried.current && width && baseSrc && img.src !== baseSrc) {
            fallbackTried.current = true;
            disableImageTransforms();
            img.src = baseSrc;
            return;
          }
          setErrored(true);
          setLoaded(true);
        }}
        className={cn(
          'w-full h-full transition-all duration-700 ease-out',
          fit === 'cover' ? 'object-cover' : 'object-contain',
          loaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-sm',
          className,
        )}
      />
    </div>
  );
});

export default SmartImage;
