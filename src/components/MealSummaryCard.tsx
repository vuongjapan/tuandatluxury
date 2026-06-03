import { useMemo, useState } from 'react';
import { Receipt, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { NightInfo } from '@/hooks/useNightlyMandatoryInfo';
import type { ComboPackage, ComboMenu, ComboMenuDish } from '@/hooks/useComboPackages';
import type { DayMealSelection } from './DayMealCard';
import type { FoodItem } from './IndividualFoodSelector';

interface Props {
  nights: NightInfo[];
  foodByDay: Record<string, DayMealSelection>;
  individualFoodsByDay: Record<string, FoodItem[]>;
  packages: ComboPackage[];
  getMenusByPackage: (pkgId: string) => ComboMenu[];
  getDishesByMenu?: (menuId: string) => ComboMenuDish[];
}

interface DetailPopup {
  title: string;
  subtitle?: string;
  items: string[];
  imageUrl?: string | null;
  amount?: number;
}

const MealSummaryCard = ({ nights, foodByDay, individualFoodsByDay, packages, getMenusByPackage, getDishesByMenu }: Props) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [detail, setDetail] = useState<DetailPopup | null>(null);

  const rows = useMemo(() => {
    return nights
      .map(n => {
        const sel = foodByDay[n.date];
        const ind = individualFoodsByDay[n.date] || [];
        const indTotal = ind.reduce(
          (s, f) => s + (f.priceType === 'negotiable' ? 0 : f.price * f.quantity),
          0,
        );

        type Line = {
          label: string;
          amount: number;
          detail?: DetailPopup;
        };
        const lines: Line[] = [];

        if (sel && !sel.bypassed && sel.meals.length > 0) {
          sel.groups
            ?.filter(g => g.comboPackageId && g.quantity > 0)
            .forEach((g, idx) => {
              const pkg = packages.find(p => p.id === g.comboPackageId);
              if (!pkg) return;
              const menu = getMenusByPackage(pkg.id).find(m => m.id === g.comboMenuId);
              const menuLabel = menu ? (isVi ? menu.name_vi : menu.name_en || menu.name_vi) : '';
              const dishes = (menu && getDishesByMenu) ? getDishesByMenu(menu.id) : [];
              const dishNames = dishes.map(d => (isVi ? d.name_vi : d.name_en || d.name_vi));
              for (const meal of sel.meals) {
                const mealLabel = meal === 'lunch' ? (isVi ? 'Trưa' : 'Lunch') : isVi ? 'Tối' : 'Dinner';
                lines.push({
                  label: `${isVi ? `Nhóm ${idx + 1}` : `Group ${idx + 1}`}: ${pkg.name}${menuLabel ? ` · ${menuLabel}` : ''} × ${g.quantity} ${isVi ? 'suất' : 'pax'} · ${mealLabel}`,
                  amount: pkg.price_per_person * g.quantity,
                  detail: dishNames.length ? {
                    title: `${pkg.name}${menuLabel ? ` — ${menuLabel}` : ''}`,
                    subtitle: `${g.quantity} ${isVi ? 'suất' : 'pax'} · ${mealLabel}`,
                    items: dishNames,
                    amount: pkg.price_per_person * g.quantity,
                  } : undefined,
                });
              }
            });

          if (sel.personalSelection) {
            const ps = sel.personalSelection;
            for (const meal of sel.meals) {
              const mealLabel = meal === 'lunch' ? (isVi ? 'Trưa' : 'Lunch') : (isVi ? 'Tối' : 'Dinner');
              lines.push({
                label: `${isVi ? 'Suất riêng' : 'Personal set'}: ${ps.name} · ${mealLabel}`,
                amount: ps.price,
                detail: {
                  title: ps.name,
                  subtitle: `${isVi ? 'Suất riêng' : 'Personal set'} · ${mealLabel}`,
                  items: ps.items,
                  imageUrl: ps.imageUrl,
                  amount: ps.price,
                },
              });
            }
          }
        }

        // Group à la carte items by meal so we never collapse Lunch + Dinner into one row.
        const indByMeal: Record<'lunch' | 'dinner', FoodItem[]> = { lunch: [], dinner: [] };
        for (const f of ind) {
          const m = (f.meal === 'lunch' ? 'lunch' : 'dinner');
          indByMeal[m].push(f);
        }
        const buildIndLine = (mealKey: 'lunch' | 'dinner') => {
          const arr = indByMeal[mealKey];
          if (arr.length === 0) return null;
          const total = arr.reduce(
            (s, f) => s + (f.priceType === 'negotiable' ? 0 : f.price * f.quantity),
            0,
          );
          return {
            meal: mealKey,
            count: arr.length,
            total,
            items: arr.map(f => `${f.name}${f.priceLabel ? ` (${f.priceLabel})` : ''} × ${f.quantity}${f.priceType === 'negotiable' || f.price === 0 ? ` — ${isVi ? 'Thoả thuận' : 'On request'}` : ` — ${(f.price * f.quantity).toLocaleString('vi-VN')}đ`}`),
          };
        };
        const indLines = [buildIndLine('lunch'), buildIndLine('dinner')].filter(Boolean) as {
          meal: 'lunch' | 'dinner'; count: number; total: number; items: string[];
        }[];

        const bypassed = sel?.bypassed;
        if (!lines.length && indLines.length === 0 && !bypassed) return null;
        return { night: n, lines, indLines, bypassed };
      })
      .filter(Boolean) as {
      night: NightInfo;
      lines: { label: string; amount: number; detail?: DetailPopup }[];
      indLines: { meal: 'lunch' | 'dinner'; count: number; total: number; items: string[] }[];
      bypassed: boolean | undefined;
    }[];
  }, [nights, foodByDay, individualFoodsByDay, packages, getMenusByPackage, getDishesByMenu, isVi]);

  const grandTotal = useMemo(
    () =>
      rows.reduce(
        (s, r) => s + r.lines.reduce((a, l) => a + l.amount, 0) + r.indLines.reduce((a, l) => a + l.total, 0),
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
        {rows.map(({ night, lines, indLines, bypassed }) => (
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
            {lines.map((l, i) => (
              <div key={i} className="flex justify-between gap-2 text-sm text-muted-foreground pl-3 py-0.5">
                <span className="min-w-0 flex items-center gap-1.5">
                  <span className="truncate">{l.label}</span>
                  {l.detail && (
                    <button
                      type="button"
                      onClick={() => setDetail(l.detail!)}
                      className="shrink-0 inline-flex items-center gap-0.5 text-[11px] text-primary hover:underline"
                    >
                      <Eye className="h-3 w-3" />
                      {isVi ? 'Xem món' : 'View'}
                    </button>
                  )}
                </span>
                <span className="font-medium text-foreground whitespace-nowrap tabular-nums">
                  {l.amount.toLocaleString('vi-VN')}đ
                </span>
              </div>
            ))}
            {indLines.map((indLine) => {
              const mealIcon = indLine.meal === 'lunch' ? '🌞' : '🌙';
              const mealLabel = indLine.meal === 'lunch' ? (isVi ? 'Bữa trưa' : 'Lunch') : (isVi ? 'Bữa tối' : 'Dinner');
              return (
                <div key={indLine.meal} className="flex justify-between gap-2 text-sm text-muted-foreground pl-3 py-0.5">
                  <span className="min-w-0 flex items-center gap-1.5">
                    <span>{mealIcon} {mealLabel} — {isVi ? 'Món riêng' : 'À la carte'} ({indLine.count} {isVi ? 'món' : 'items'})</span>
                    <button
                      type="button"
                      onClick={() => setDetail({
                        title: `${mealIcon} ${mealLabel} — ${isVi ? 'Món riêng đã đặt' : 'À la carte items'}`,
                        subtitle: `${night.dayLabel}, ${night.formattedDate}`,
                        items: indLine.items,
                        amount: indLine.total,
                      })}
                      className="shrink-0 inline-flex items-center gap-0.5 text-[11px] text-primary hover:underline"
                    >
                      <Eye className="h-3 w-3" />
                      {isVi ? 'Xem món' : 'View'}
                    </button>
                  </span>
                  <span className="font-medium text-foreground tabular-nums">
                    {indLine.total.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex justify-between font-bold text-primary border-t-2 border-primary/30 pt-2.5 mt-2.5">
        <span>{isVi ? 'Tổng tiền ăn' : 'Total meals'}</span>
        <span className="tabular-nums">{grandTotal.toLocaleString('vi-VN')}đ</span>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">{detail?.title}</DialogTitle>
          </DialogHeader>
          {detail?.subtitle && (
            <p className="text-xs text-muted-foreground -mt-1">{detail.subtitle}</p>
          )}
          {detail?.imageUrl && (
            <img src={detail.imageUrl} alt={detail.title} className="w-full max-h-56 rounded-lg object-cover" loading="lazy" />
          )}
          <ul className="space-y-1.5 text-sm">
            {detail?.items.map((it, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
          {typeof detail?.amount === 'number' && detail.amount > 0 && (
            <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
              <span>{isVi ? 'Tạm tính' : 'Subtotal'}</span>
              <span className="text-primary tabular-nums">{detail.amount.toLocaleString('vi-VN')}đ</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MealSummaryCard;
