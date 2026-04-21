import { Clock, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export type MealTime = 'lunch' | 'dinner' | 'both';

interface Props {
  value: MealTime;
  onChange: (m: MealTime) => void;
  /** Compact = single line, smaller padding (used inside cards). */
  compact?: boolean;
  className?: string;
}

const MealTimeSelector = ({ value, onChange, compact = false, className }: Props) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const options: {
    key: MealTime;
    label: string;
    sub: string;
    icon: typeof Sun;
  }[] = [
    {
      key: 'lunch',
      label: isVi ? 'Bữa trưa' : 'Lunch',
      sub: '11:30–14:00',
      icon: Sun,
    },
    {
      key: 'dinner',
      label: isVi ? 'Bữa tối' : 'Dinner',
      sub: '17:30–21:30',
      icon: Moon,
    },
    {
      key: 'both',
      label: isVi ? 'Cả 2 bữa' : 'Both meals',
      sub: isVi ? '× 2 giá' : '× 2 price',
      icon: Clock,
    },
  ];

  return (
    <div className={cn('space-y-2', className)}>
      <p className={cn('font-semibold text-foreground', compact ? 'text-xs' : 'text-sm')}>
        🍽️ {isVi ? 'Chọn bữa ăn' : 'Choose meal time'}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const active = value === opt.key;
          const Icon = opt.icon;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className={cn(
                'rounded-lg border text-left transition-all flex flex-col gap-0.5',
                compact ? 'p-2' : 'p-2.5',
                active
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                  : 'border-border hover:border-primary/50 bg-card'
              )}
              aria-pressed={active}
            >
              <div className="flex items-center gap-1.5">
                <Icon className={cn('h-3.5 w-3.5', active ? 'text-primary' : 'text-muted-foreground')} />
                <span className={cn('text-xs font-semibold', active ? 'text-primary' : 'text-foreground')}>
                  {opt.label}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums">{opt.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MealTimeSelector;
