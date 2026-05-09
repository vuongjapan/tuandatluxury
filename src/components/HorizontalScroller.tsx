import { useRef, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDragScroll } from '@/hooks/useDragScroll';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  step?: number;
}

/**
 * Wrapper for horizontal scroll lists.
 * - Mobile: native swipe (unchanged)
 * - Desktop: click-and-drag, mouse wheel, and arrow buttons on hover
 */
const HorizontalScroller = ({ children, className, innerClassName, step = 320 }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  useDragScroll(ref);

  const scrollBy = (dx: number) => {
    ref.current?.scrollBy({ left: dx, behavior: 'smooth' });
  };

  return (
    <div className={cn('relative group', className)}>
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scrollBy(-step)}
        className="hidden md:group-hover:flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/95 border border-border shadow-md text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div
        ref={ref}
        className={cn(
          'overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 select-none',
          innerClassName,
        )}
      >
        {children}
      </div>

      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollBy(step)}
        className="hidden md:group-hover:flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/95 border border-border shadow-md text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

export default HorizontalScroller;
