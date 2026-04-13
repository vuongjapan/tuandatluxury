import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpandableListProps {
  items: React.ReactNode[];
  defaultCount?: number;
  mobileCount?: number;
  className?: string;
  expandLabel?: string;
  collapseLabel?: string;
}

const ExpandableList = ({
  items,
  defaultCount = 6,
  mobileCount = 4,
  className,
  expandLabel = '+ Xem thêm',
  collapseLabel = '– Thu gọn',
}: ExpandableListProps) => {
  const [expanded, setExpanded] = useState(false);

  // Use mobileCount on small screens via CSS, but JS uses defaultCount
  const visibleCount = expanded ? items.length : defaultCount;
  const hasMore = items.length > defaultCount;

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-1.5">
        {items.slice(0, visibleCount).map((item, i) => (
          <div
            key={i}
            className={cn(
              'transition-all duration-300 ease-out',
              !expanded && i >= mobileCount && 'hidden sm:flex',
              expanded && 'animate-in fade-in slide-in-from-top-1 duration-300',
            )}
          >
            {item}
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          {expanded ? (
            <><ChevronUp className="h-3 w-3" />{collapseLabel}</>
          ) : (
            <><ChevronDown className="h-3 w-3" />{expandLabel} ({items.length - defaultCount})</>
          )}
        </button>
      )}
    </div>
  );
};

export default ExpandableList;
