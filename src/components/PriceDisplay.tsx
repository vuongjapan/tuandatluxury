import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface Props {
  price: number;
  priceType?: 'fixed' | 'negotiable' | string | null;
  className?: string;
  /** Compact badge (smaller text) for inline use. */
  compact?: boolean;
}

/**
 * Renders either a formatted price (fixed) or an orange "Giá thỏa thuận" badge
 * (negotiable). Never renders "0đ" — when price_type is negotiable, the actual
 * price column is ignored.
 */
const PriceDisplay = ({ price, priceType = 'fixed', className, compact = false }: Props) => {
  const { formatPrice, language } = useLanguage();
  const isVi = language === 'vi';

  if (priceType === 'negotiable') {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'inline-flex items-center rounded-full font-semibold whitespace-nowrap cursor-help',
                compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
                className
              )}
              style={{ backgroundColor: '#FFF3E0', color: '#E65100' }}
            >
              {isVi ? 'Giá thỏa thuận' : 'Price on request'}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {isVi
                ? 'Liên hệ nhà hàng để biết giá: 038.441.8811'
                : 'Call the restaurant for pricing: 038.441.8811'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <span className={className}>{formatPrice(price)}</span>;
};

export default PriceDisplay;
