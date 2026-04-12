import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
}

const FadeIn = ({ children, className, delay = 0, direction = 'up' }: FadeInProps) => {
  const { ref, inView } = useInView();

  const directionStyles = {
    up: 'translate-y-6',
    left: '-translate-x-8',
    right: 'translate-x-8',
    none: '',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        inView ? 'opacity-100 translate-y-0 translate-x-0' : `opacity-0 ${directionStyles[direction]}`,
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default FadeIn;
