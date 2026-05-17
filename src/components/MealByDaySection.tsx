import { useMemo } from 'react';
import { Utensils } from 'lucide-react';
import DayMealCard, { type DayMealSelection } from './DayMealCard';
import type { NightInfo } from '@/hooks/useNightlyMandatoryInfo';
import { useComboPackages } from '@/hooks/useComboPackages';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  nights: NightInfo[];
  defaultGuests: number;
  foodByDay: Record<string, DayMealSelection>;
  onChange: (date: string, next: DayMealSelection) => void;
}

const MealByDaySection = ({ nights, defaultGuests, foodByDay, onChange }: Props) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const { packages, getMenusByPackage, getDishesByMenu, loading } = useComboPackages();

  const activePackages = useMemo(
    () => packages.filter(p => p.is_active).sort((a, b) => a.sort_order - b.sort_order),
    [packages],
  );

  const lines = useMemo(() => {
    return nights
      .map(n => {
        const sel = foodByDay[n.date];
        if (!sel || !sel.comboPackageId || sel.meals.length === 0) return null;
        const pkg = activePackages.find(p => p.id === sel.comboPackageId);
        if (!pkg) return null;
        const amount = pkg.price_per_person * sel.quantity * sel.meals.length;
        return {
          date: n.date,
          label: `${n.dayLabel} ${n.formattedDate} — ${pkg.name} × ${sel.quantity}${sel.meals.length === 2 ? (isVi ? ' (cả 2 bữa)' : ' (both meals)') : ''}`,
          amount,
        };
      })
      .filter(Boolean) as { date: string; label: string; amount: number }[];
  }, [nights, foodByDay, activePackages, isVi]);

  const total = lines.reduce((s, l) => s + l.amount, 0);

  if (nights.length === 0) return null;

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
          {nights.map(n => (
            <DayMealCard
              key={n.date}
              night={n}
              defaultGuests={defaultGuests}
              packages={activePackages}
              getMenusByPackage={getMenusByPackage}
              getDishesByMenu={getDishesByMenu}
              value={foodByDay[n.date] || { meals: [], comboPackageId: '', comboMenuId: '', quantity: defaultGuests }}
              onChange={next => onChange(n.date, next)}
            />
          ))}
        </div>
      )}

      {lines.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4 sm:p-5 space-y-1.5">
          {lines.map(l => (
            <div key={l.date} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{l.label}</span>
              <span className="tabular-nums">{l.amount.toLocaleString('vi-VN')}đ</span>
            </div>
          ))}
          <div className="flex justify-between font-bold border-t border-border pt-2 mt-2 text-base">
            <span>{isVi ? 'Tổng tiền ăn' : 'Total meals'}</span>
            <span className="text-primary tabular-nums">{total.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>
      )}
    </section>
  );
};

export default MealByDaySection;
