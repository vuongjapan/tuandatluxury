import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface PriceVariant {
  label_vi?: string;
  label_en?: string;
  price_vnd: number;
}

interface Props {
  price: number;
  priceType?: 'fixed' | 'negotiable' | string | null;
  /** When false, force "Liên hệ" badge regardless of price value. */
  showPrice?: boolean;
  /** Multi-tier prices (small/medium/large…). When ≥1 fixed entry, show range "40k–80k". */
  variants?: PriceVariant[] | null;
  className?: string;
  /** Compact badge (smaller text) for inline use. */
  compact?: boolean;
}

const formatShort = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}tr`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
};

/**
 * Renders a price, a price range (when multi-variants exist), or a "Liên hệ" badge.
 * Never renders "0đ" — any item with price=0 OR show_price=false OR negotiable
 * shows the orange "Liên hệ" badge instead.
 */
const PriceDisplay = ({
  price,
  priceType = 'fixed',
  showPrice = true,
  variants = null,
  className,
  compact = false,
}: Props) => {
  const { formatPrice, language } = useLanguage();
  const isVi = language === 'vi';

  const validVariants = (variants || []).filter(v => v.price_vnd > 0);
  const isNegotiable =
    priceType === 'negotiable' ||
    showPrice === false ||
    (price <= 0 && validVariants.length === 0);

  if (isNegotiable) {
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
              {isVi ? 'Liên hệ' : 'Contact'}
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

  // Multi-variants → show range "40k – 80k"
  if (validVariants.length >= 2) {
    const prices = validVariants.map(v => v.price_vnd).sort((a, b) => a - b);
    const min = prices[0];
    const max = prices[prices.length - 1];
    return (
      <span className={className}>
        {min === max ? formatPrice(min) : `${formatShort(min)}đ – ${formatShort(max)}đ`}
      </span>
    );
  }

  return <span className={className}>{formatPrice(price)}</span>;
};

export default PriceDisplay;
