import { useMemo, useState } from 'react';
import { Utensils, ChevronDown, CheckCircle2 } from 'lucide-react';
import DayMealCard, { type DayMealSelection } from './DayMealCard';
import type { NightInfo } from '@/hooks/useNightlyMandatoryInfo';
import { useComboPackages } from '@/hooks/useComboPackages';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface Props {
  nights: NightInfo[];
  defaultGuests: number;
  foodByDay: Record<string, DayMealSelection>;
  onChange: (date: string, next: DayMealSelection) => void;
  individualOption?: {
    total: number;
    required: number;
    met: boolean;
    onOpenMenu: () => void;
  };
}

const MealByDaySection = ({ nights, defaultGuests, foodByDay, onChange, individualOption }: Props) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const { packages, getMenusByPackage, getDishesByMenu, loading } = useComboPackages();

  const activePackages = useMemo(
    () => packages.filter(p => p.is_active).sort((a, b) => a.sort_order - b.sort_order),
    [packages],
  );

  const mandatoryNights = useMemo(() => nights.filter(n => n.mandatory), [nights]);
  const optionalNights = useMemo(() => nights.filter(n => !n.mandatory), [nights]);

  // Auto-open accordion if any optional night already has selections
  const initialOpen = optionalNights.some(n => {
    const s = foodByDay[n.date];
    return s && (s.meals.length > 0 || s.bypassed);
  });
  const [showOptional, setShowOptional] = useState(initialOpen);

  const lines = useMemo(() => {
    return nights
      .map(n => {
        const sel = foodByDay[n.date];
        if (!sel || sel.bypassed || !sel.comboPackageId || sel.meals.length === 0) return null;
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
          {/* Optional nights — collapsed accordion */}
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
                      value={foodByDay[n.date] || { meals: [], comboPackageId: '', comboMenuId: '', quantity: defaultGuests }}
                      onChange={next => onChange(n.date, next)}
                      variant="optional"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mandatory nights — always shown */}
          {mandatoryNights.map(n => (
            <DayMealCard
              key={n.date}
              night={n}
              defaultGuests={defaultGuests}
              packages={activePackages}
              getMenusByPackage={getMenusByPackage}
              getDishesByMenu={getDishesByMenu}
              value={foodByDay[n.date] || { meals: [], comboPackageId: '', comboMenuId: '', quantity: defaultGuests }}
              onChange={next => onChange(n.date, next)}
              variant="mandatory"
              individualOption={individualOption}
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
