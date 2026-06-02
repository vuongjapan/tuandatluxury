import { useMemo } from 'react';
import { Receipt } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { NightInfo } from '@/hooks/useNightlyMandatoryInfo';
import type { ComboPackage, ComboMenu } from '@/hooks/useComboPackages';
import type { DayMealSelection } from './DayMealCard';
import type { FoodItem } from './IndividualFoodSelector';

interface Props {
  nights: NightInfo[];
  foodByDay: Record<string, DayMealSelection>;
  individualFoodsByDay: Record<string, FoodItem[]>;
  packages: ComboPackage[];
  getMenusByPackage: (pkgId: string) => ComboMenu[];
}

const MealSummaryCard = ({ nights, foodByDay, individualFoodsByDay, packages, getMenusByPackage }: Props) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const rows = useMemo(() => {
    return nights
      .map(n => {
        const sel = foodByDay[n.date];
        const ind = individualFoodsByDay[n.date] || [];
        const indTotal = ind.reduce(
          (s, f) => s + (f.priceType === 'negotiable' ? 0 : f.price * f.quantity),
          0,
        );

        let comboLines: { label: string; amount: number }[] = [];
        if (sel && !sel.bypassed && sel.meals.length > 0) {
          sel.groups
            .filter(g => g.comboPackageId && g.quantity > 0)
            .forEach((g, idx) => {
              const pkg = packages.find(p => p.id === g.comboPackageId);
              if (!pkg) return;
              const menu = getMenusByPackage(pkg.id).find(m => m.id === g.comboMenuId);
              const menuLabel = menu ? (isVi ? menu.name_vi : menu.name_en || menu.name_vi) : '';
              for (const meal of sel.meals) {
                const mealLabel =
                  meal === 'lunch' ? (isVi ? 'Trưa' : 'Lunch') : isVi ? 'Tối' : 'Dinner';
                comboLines.push({
                  label: `${isVi ? `Nhóm ${idx + 1}` : `Group ${idx + 1}`}: ${pkg.name}${menuLabel ? ` · ${menuLabel}` : ''} × ${g.quantity} ${isVi ? 'suất' : 'pax'} · ${mealLabel}`,
                  amount: pkg.price_per_person * g.quantity,
                });
              }
            });

          if (sel.personalSelection) {
            const ps = sel.personalSelection;
            for (const meal of sel.meals) {
              const mealLabel = meal === 'lunch' ? (isVi ? 'Trưa' : 'Lunch') : (isVi ? 'Tối' : 'Dinner');
              comboLines.push({
                label: `${isVi ? 'Suất riêng' : 'Personal set'}: ${ps.name} · ${mealLabel}`,
                amount: ps.price,
              });
            }
          }
        }

        const bypassed = sel?.bypassed;
        if (!comboLines.length && indTotal === 0 && !bypassed) return null;
        return { night: n, comboLines, indTotal, ind, bypassed };
      })
      .filter(Boolean) as {
      night: NightInfo;
      comboLines: { label: string; amount: number }[];
      indTotal: number;
      ind: FoodItem[];
      bypassed: boolean | undefined;
    }[];
  }, [nights, foodByDay, individualFoodsByDay, packages, getMenusByPackage, isVi]);

  const grandTotal = useMemo(
    () =>
      rows.reduce(
        (s, r) => s + r.comboLines.reduce((a, l) => a + l.amount, 0) + r.indTotal,
        0,
      ),
    [rows],
  );

  if (rows.length === 0) return null;

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 sm:p-5">
      <h4 className="font-display text-base sm:text-lg font-semibold flex items-center gap-2 mb-3">
        <Receipt className="h-4 w-4 text-primary" />
        {isVi ? 'Tóm tắt bữa ăn đã chọn' : 'Selected meals summary'}
      </h4>

      <div className="space-y-3">
        {rows.map(({ night, comboLines, indTotal, ind, bypassed }) => (
          <div
            key={night.date}
            className="pb-3 border-b border-border/60 last:border-0 last:pb-0"
          >
            <div className="font-semibold text-sm mb-1.5">
              {night.dayLabel}, {night.formattedDate}
              {bypassed && (
                <span className="ml-2 text-[11px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                  {isVi ? 'Miễn trừ' : 'Bypassed'}
                </span>
              )}
            </div>
            {comboLines.map((l, i) => (
              <div key={i} className="flex justify-between text-sm text-muted-foreground pl-3">
                <span className="min-w-0 truncate pr-2">{l.label}</span>
                <span className="font-medium text-foreground whitespace-nowrap tabular-nums">
                  {l.amount.toLocaleString('vi-VN')}đ
                </span>
              </div>
            ))}
            {indTotal > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground pl-3">
                <span>
                  🍤 {isVi ? 'Món riêng' : 'À la carte'} ({ind.length}{' '}
                  {isVi ? 'món' : 'items'})
                </span>
                <span className="font-medium text-foreground tabular-nums">
                  {indTotal.toLocaleString('vi-VN')}đ
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between font-bold text-primary border-t-2 border-primary/30 pt-2.5 mt-2.5">
        <span>{isVi ? 'Tổng tiền ăn' : 'Total meals'}</span>
        <span className="tabular-nums">{grandTotal.toLocaleString('vi-VN')}đ</span>
      </div>
    </div>
  );
};

export default MealSummaryCard;
