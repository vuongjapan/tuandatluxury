import { ImgHTMLAttributes, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Optional wrapper className. Use to set sizing/aspect-ratio. */
  wrapperClassName?: string;
}

/**
 * Drop-in replacement for <img> that:
 * - Shows a shimmer skeleton until the image loads
 * - Fades the image in once decoded (no flash of old/cached image)
 * - Falls back to a placeholder icon on error
 */
const LazyImage = ({
  src,
  alt = '',
  className,
  wrapperClassName,
  loading = 'lazy',
  decoding = 'async',
  onLoad,
  onError,
  ...rest
}: LazyImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={cn('relative overflow-hidden bg-muted', wrapperClassName)}>
      {!loaded && !error && (
        <div
          className="absolute inset-0 animate-shimmer"
          style={{
            background:
              'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--secondary)) 50%, hsl(var(--muted)) 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      )}

      {!error && (
        <img
          {...rest}
          src={src}
          alt={alt}
          loading={loading}
          decoding={decoding}
          onLoad={(e) => {
            setLoaded(true);
            onLoad?.(e);
          }}
          onError={(e) => {
            setError(true);
            onError?.(e);
          }}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0',
            className,
          )}
        />
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <ImageIcon className="h-8 w-8 opacity-40" />
        </div>
      )}
    </div>
  );
};

export default LazyImage;
