import { useMemo, useState } from 'react';
import { Utensils, ChevronDown, CheckCircle2 } from 'lucide-react';
import DayMealCard, { type DayMealSelection, buildDefaultGroups } from './DayMealCard';
import type { NightInfo } from '@/hooks/useNightlyMandatoryInfo';
import { useComboPackages } from '@/hooks/useComboPackages';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { FoodItem } from './IndividualFoodSelector';

interface Props {
  nights: NightInfo[];
  defaultGuests: number;
  adults: number;
  minPerPerson: number;
  foodByDay: Record<string, DayMealSelection>;
  individualFoodsByDay: Record<string, FoodItem[]>;
  onChange: (date: string, next: DayMealSelection) => void;
  onOpenIndividual: (date: string) => void;
  onRemoveIndividualItem: (date: string, cartKey: string) => void;
}

const sumIndividual = (items: FoodItem[]) =>
  items.reduce(
    (s, f) => s + (f.priceType === 'negotiable' ? 0 : f.price * f.quantity),
    0,
  );

const MealByDaySection = ({
  nights,
  defaultGuests,
  adults,
  minPerPerson,
  foodByDay,
  individualFoodsByDay,
  onChange,
  onOpenIndividual,
  onRemoveIndividualItem,
}: Props) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const { packages, getMenusByPackage, getDishesByMenu, loading } = useComboPackages();

  const activePackages = useMemo(
    () => packages.filter(p => p.is_active).sort((a, b) => a.sort_order - b.sort_order),
    [packages],
  );

  const mandatoryNights = useMemo(() => nights.filter(n => n.mandatory), [nights]);
  const optionalNights = useMemo(() => nights.filter(n => !n.mandatory), [nights]);

  const initialOpen = optionalNights.some(n => {
    const s = foodByDay[n.date];
    return s && (s.meals.length > 0 || s.bypassed);
  });
  const [showOptional, setShowOptional] = useState(initialOpen);

  if (nights.length === 0) return null;

  const buildIndividualOption = (date: string, mandatory: boolean) => {
    const items = individualFoodsByDay[date] || [];
    const total = sumIndividual(items);
    const required = mandatory ? Math.max(1, adults) * minPerPerson : 0;
    const met = mandatory ? total >= required : false;
    return {
      total,
      required,
      met,
      items,
      onOpenMenu: () => onOpenIndividual(date),
      onRemoveItem: (cartKey: string) => onRemoveIndividualItem(date, cartKey),
    };
  };

  const defaultSel = (): DayMealSelection => ({
    meals: [],
    groups: buildDefaultGroups(defaultGuests),
  });

  return (
    <section id="combo-section" className="space-y-4">
      <div className="flex items-center gap-2">
        <Utensils className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg sm:text-xl font-semibold">
          {isVi ? 'Bữa ăn theo từng ngày' : 'Meals per day'}
        </h3>
      </div>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-6 text-sm text-muted-foreground">
          {isVi ? 'Đang tải combo…' : 'Loading combos…'}
        </div>
      ) : (
        <div className="space-y-3">
          {optionalNights.length > 0 && (
            <div className="border border-emerald-200 dark:border-emerald-900/50 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowOptional(v => !v)}
                className="w-full flex items-center justify-between gap-3 p-3.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-sm text-emerald-900 dark:text-emerald-200">
                    {isVi
                      ? `Ngày không bắt buộc đặt ăn (${optionalNights.length} ngày)`
                      : `Optional meal days (${optionalNights.length})`}
                  </span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="hidden sm:block text-xs text-emerald-700/80 dark:text-emerald-300/70 truncate max-w-[280px]">
                    {optionalNights.map(n => `${n.dayLabel} ${n.formattedDate}`).join(' · ')}
                  </span>
                  <ChevronDown className={cn('h-4 w-4 text-emerald-700 dark:text-emerald-300 transition-transform shrink-0', showOptional && 'rotate-180')} />
                </div>
              </button>

              {showOptional && (
                <div className="p-3 sm:p-4 space-y-2 border-t border-emerald-200 dark:border-emerald-900/50 bg-card">
                  <p className="text-xs text-muted-foreground mb-1">
                    {isVi
                      ? 'Có thể bỏ qua hoặc đặt trước combo để phục vụ ngay khi nhận phòng.'
                      : 'Optional — you may pre-order or skip and order at the restaurant.'}
                  </p>
                  {optionalNights.map(n => (
                    <DayMealCard
                      key={n.date}
                      night={n}
                      defaultGuests={defaultGuests}
                      packages={activePackages}
                      getMenusByPackage={getMenusByPackage}
                      getDishesByMenu={getDishesByMenu}
                      value={foodByDay[n.date] || defaultSel()}
                      onChange={next => onChange(n.date, next)}
                      variant="optional"
                      individualOption={buildIndividualOption(n.date, false)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {mandatoryNights.map(n => (
            <DayMealCard
              key={n.date}
              night={n}
              defaultGuests={defaultGuests}
              packages={activePackages}
              getMenusByPackage={getMenusByPackage}
              getDishesByMenu={getDishesByMenu}
              value={foodByDay[n.date] || defaultSel()}
              onChange={next => onChange(n.date, next)}
              variant="mandatory"
              individualOption={buildIndividualOption(n.date, true)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default MealByDaySection;
