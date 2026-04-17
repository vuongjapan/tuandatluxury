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
        <div
          aria-hidden
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-secondary to-muted"
        />
      )}
      <img
        {...rest}
        src={finalSrc}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => { setErrored(true); setLoaded(true); }}
        className={cn(
          'w-full h-full transition-opacity duration-300',
          fit === 'cover' ? 'object-cover' : 'object-contain',
          loaded ? 'opacity-100' : 'opacity-0',
          className,
        )}
      />
    </div>
  );
});

export default SmartImage;
