import { Globe, ChevronDown, Coins } from 'lucide-react';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Currency = 'VND' | 'USD' | 'JPY' | 'CNY';
const CURRENCIES: Currency[] = ['VND', 'USD', 'JPY', 'CNY'];

interface Props {
  /** "compact" hides labels, just icons (mobile). "full" shows labels (desktop top bar). */
  variant?: 'compact' | 'full';
}

/**
 * Switcher kép: ngôn ngữ + tiền tệ. Có hiệu ứng fade khi đổi text toàn site.
 */
const LanguageCurrencySwitcher = ({ variant = 'full' }: Props) => {
  const { language, setLanguage, currency, setCurrency, langLabels, currencyLabels } = useLanguage();

  const triggerClass =
    variant === 'full'
      ? 'flex items-center gap-1 hover:text-background transition-colors'
      : 'flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary transition-colors text-xs';

  return (
    <div className={variant === 'full' ? 'flex items-center gap-3' : 'flex items-center gap-1'}>
      {/* Language */}
      <DropdownMenu>
        <DropdownMenuTrigger className={triggerClass} aria-label="Change language">
          <Globe className="h-3.5 w-3.5" />
          {variant === 'full' && <span>{language.toUpperCase()}</span>}
          <ChevronDown className="h-2.5 w-2.5 opacity-70" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px] z-[100]">
          {(Object.keys(langLabels) as Language[]).map((lang) => (
            <DropdownMenuItem
              key={lang}
              onClick={() => setLanguage(lang)}
              className={lang === language ? 'bg-secondary font-semibold' : ''}
            >
              {langLabels[lang]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Currency */}
      <DropdownMenu>
        <DropdownMenuTrigger className={triggerClass} aria-label="Change currency">
          <Coins className="h-3.5 w-3.5" />
          {variant === 'full' && <span>{currency}</span>}
          <ChevronDown className="h-2.5 w-2.5 opacity-70" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[140px] z-[100]">
          {CURRENCIES.map((cur) => (
            <DropdownMenuItem
              key={cur}
              onClick={() => setCurrency(cur)}
              className={cur === currency ? 'bg-secondary font-semibold' : ''}
            >
              {currencyLabels[cur]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default LanguageCurrencySwitcher;
