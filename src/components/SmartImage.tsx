import { useState, memo, ImgHTMLAttributes } from 'react';
import { withImageVersion } from '@/lib/imageVersion';
import { cn } from '@/lib/utils';

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onLoad' | 'onError'> {
  src: string | null | undefined;
  alt: string;
  /** Container className (wraps the img + skeleton overlay). */
  wrapperClassName?: string;
  /** Object-fit class for the img (default: object-cover). */
  fit?: 'cover' | 'contain';
  /** Skip cache-busting (e.g. for static bundled assets). */
  skipVersion?: boolean;
  /** Eager-load critical above-the-fold images. */
  eager?: boolean;
}

/**
 * Image with skeleton-loading placeholder, fade-in on load,
 * lazy-loading by default, and cache-bust versioning.
 *
 * Memoized to avoid unnecessary re-renders in long lists.
 */
const SmartImage = memo(function SmartImage({
  src, alt, wrapperClassName, className, fit = 'cover',
  skipVersion = false, eager = false, ...rest
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const finalSrc = errored
    ? '/placeholder.svg'
    : (skipVersion ? (src || '/placeholder.svg') : withImageVersion(src));

  return (
    <div className={cn('relative overflow-hidden bg-muted', wrapperClassName)}>
      {!loaded && (
        <>
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-muted via-secondary to-muted"
          />
          {/* Shimmer sweep */}
          <div
            aria-hidden
            className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"
            style={{ animationName: 'shimmer' }}
          />
        </>
      )}
      <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
      <img
        {...rest}
        src={finalSrc}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : 'auto' as any}
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          setErrored(true);
          setLoaded(true);
          (e.currentTarget as HTMLImageElement).style.background = 'hsl(var(--muted))';
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
