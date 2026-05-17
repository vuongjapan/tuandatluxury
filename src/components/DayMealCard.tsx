import { useState, useMemo, useEffect } from 'react';
import { Sun, Moon, Clock, AlertTriangle, Plus, Minus, ChevronDown, CalendarDays, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { NightInfo } from '@/hooks/useNightlyMandatoryInfo';
import type { ComboPackage, ComboMenu, ComboMenuDish } from '@/hooks/useComboPackages';

export type DayMeal = 'lunch' | 'dinner';

export interface DayMealSelection {
  meals: DayMeal[];          // [] | ['lunch'] | ['dinner'] | ['lunch','dinner']
  comboPackageId: string;    // '' if none
  comboMenuId: string;       // '' if none
  quantity: number;
}

interface Props {
  night: NightInfo;
  defaultGuests: number;
  packages: ComboPackage[];
  getMenusByPackage: (pkgId: string) => ComboMenu[];
  getDishesByMenu: (menuId: string) => ComboMenuDish[];
  value: DayMealSelection;
  onChange: (next: DayMealSelection) => void;
}

const emptySel = (qty: number): DayMealSelection => ({
  meals: [],
  comboPackageId: '',
  comboMenuId: '',
  quantity: qty,
});

const DayMealCard = ({ night, defaultGuests, packages, getMenusByPackage, getDishesByMenu, value, onChange }: Props) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const [expanded, setExpanded] = useState<boolean>(night.mandatory || value.meals.length > 0);

  // When mandatory flips on, force open.
  useEffect(() => {
    if (night.mandatory) setExpanded(true);
  }, [night.mandatory]);

  const set = (patch: Partial<DayMealSelection>) => onChange({ ...value, ...patch });

  const toggleBoth = () => {
    const both = value.meals.length === 2;
    set({ meals: both ? ['dinner'] : ['lunch', 'dinner'] });
  };
  const pick = (m: DayMeal) => {
    if (value.meals.length === 1 && value.meals[0] === m) return; // keep one selected
    set({ meals: [m] });
  };

  const menus = useMemo(
    () => (value.comboPackageId ? getMenusByPackage(value.comboPackageId) : []),
    [value.comboPackageId, getMenusByPackage],
  );
  const dishes = useMemo(
    () => (value.comboMenuId ? getDishesByMenu(value.comboMenuId) : []),
    [value.comboMenuId, getDishesByMenu],
  );
  const selectedPkg = packages.find(p => p.id === value.comboPackageId);

  const subtotal = selectedPkg ? selectedPkg.price_per_person * Math.max(0, value.quantity) * value.meals.length : 0;

  const isComplete = value.meals.length > 0 && !!value.comboPackageId && value.quantity > 0;
  const incomplete = night.mandatory && !isComplete;

  return (
    <div
      id={`day-meal-${night.date}`}
      className={cn(
        'rounded-xl border p-4 sm:p-5 transition-all',
        night.mandatory
          ? incomplete
            ? 'border-orange-300 bg-orange-50/60 dark:bg-orange-950/20'
            : 'border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/10'
          : 'border-border bg-card',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays className={cn('h-4 w-4 shrink-0', night.mandatory ? 'text-orange-600' : 'text-muted-foreground')} />
          <span className="font-semibold text-sm sm:text-base truncate">
            {night.dayLabel}, {night.formattedDate}
          </span>
          {night.mandatory ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 shrink-0">
              <AlertTriangle className="h-3 w-3" />
              {isVi ? 'Bắt buộc chọn ăn' : 'Meal required'}
            </span>
          ) : isComplete ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 shrink-0">
              <CheckCircle2 className="h-3 w-3" />
              {isVi ? 'Đã chọn' : 'Selected'}
            </span>
          ) : null}
        </div>
        {!night.mandatory && (
          <button
            type="button"
            onClick={() => {
              if (expanded) {
                // collapse → clear
                onChange(emptySel(defaultGuests));
              }
              setExpanded(e => !e);
            }}
            className="text-xs font-medium text-primary hover:underline shrink-0"
          >
            {expanded ? (isVi ? 'Thu gọn' : 'Collapse') : `+ ${isVi ? 'Thêm bữa ăn (tuỳ chọn)' : 'Add meal (optional)'}`}
          </button>
        )}
      </div>

      {!night.mandatory && !expanded && (
        <p className="text-xs text-muted-foreground mt-2">
          ✅ {isVi
            ? 'Không bắt buộc — có thể gọi món trực tiếp tại nhà hàng sau check-in.'
            : 'Optional — you can order at the restaurant after check-in.'}
        </p>
      )}

      {(night.mandatory || expanded) && (
        <div className="mt-4 space-y-4">
          {/* Meal time pills */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">
              {isVi ? 'Chọn buổi ăn' : 'Choose meal time'} {night.mandatory && <span className="text-orange-600">*</span>}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'lunch' as DayMeal, label: isVi ? 'Bữa trưa' : 'Lunch', sub: '11:30–14:00', icon: Sun },
                { key: 'dinner' as DayMeal, label: isVi ? 'Bữa tối' : 'Dinner', sub: '17:30–21:30', icon: Moon },
              ]).map(opt => {
                const active = value.meals.includes(opt.key) && value.meals.length === 1;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => pick(opt.key)}
                    className={cn(
                      'rounded-lg border p-2 flex flex-col items-start gap-0.5 transition-all',
                      active ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-border hover:border-primary/50 bg-card',
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className={cn('h-3.5 w-3.5', active ? 'text-primary' : 'text-muted-foreground')} />
                      <span className={cn('text-xs font-semibold', active ? 'text-primary' : 'text-foreground')}>{opt.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{opt.sub}</span>
                  </button>
                );
              })}
              {(() => {
                const active = value.meals.length === 2;
                return (
                  <button
                    type="button"
                    onClick={toggleBoth}
                    className={cn(
                      'rounded-lg border p-2 flex flex-col items-start gap-0.5 transition-all',
                      active ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-border hover:border-primary/50 bg-card',
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Clock className={cn('h-3.5 w-3.5', active ? 'text-primary' : 'text-muted-foreground')} />
                      <span className={cn('text-xs font-semibold', active ? 'text-primary' : 'text-foreground')}>
                        {isVi ? 'Cả 2 bữa' : 'Both meals'}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{isVi ? '× 2 giá' : '× 2 price'}</span>
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Combo packages */}
          {value.meals.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">
                {isVi ? 'Chọn combo' : 'Choose combo'} {night.mandatory && <span className="text-orange-600">*</span>}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {packages.map(pkg => {
                  const active = value.comboPackageId === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => {
                        const firstMenu = getMenusByPackage(pkg.id)[0];
                        set({ comboPackageId: pkg.id, comboMenuId: firstMenu?.id || '' });
                      }}
                      className={cn(
                        'rounded-lg border p-3 text-left transition-all',
                        active ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-border hover:border-primary/50 bg-card',
                      )}
                    >
                      <div className={cn('text-sm font-semibold', active ? 'text-primary' : 'text-foreground')}>{pkg.name}</div>
                      <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                        {pkg.price_per_person.toLocaleString('vi-VN')}đ/{isVi ? 'người' : 'pax'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Menu select */}
          {value.comboPackageId && menus.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">
                {isVi ? 'Chọn thực đơn' : 'Choose menu'}
              </label>
              <div className="relative">
                <select
                  value={value.comboMenuId}
                  onChange={e => set({ comboMenuId: e.target.value })}
                  className="w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {menus.map(m => (
                    <option key={m.id} value={m.id}>
                      {isVi ? `Thực đơn ${m.menu_number} — ${m.name_vi}` : `Menu ${m.menu_number} — ${m.name_en || m.name_vi}`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              {dishes.length > 0 && (
                <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                  {dishes.map(d => (isVi ? d.name_vi : d.name_en || d.name_vi)).join(' · ')}
                </p>
              )}
            </div>
          )}

          {/* Quantity + subtotal */}
          {value.comboPackageId && value.meals.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  {isVi ? 'Số suất' : 'Servings'}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => set({ quantity: Math.max(1, value.quantity - 1) })}
                    className="w-8 h-8 rounded-full border border-border hover:border-primary flex items-center justify-center"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-bold w-8 text-center tabular-nums">{value.quantity}</span>
                  <button
                    type="button"
                    onClick={() => set({ quantity: value.quantity + 1 })}
                    className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="bg-primary/5 rounded-lg p-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {isVi ? 'Tạm tính' : 'Subtotal'}{' '}
                  <span className="text-foreground/80">
                    ({selectedPkg!.price_per_person.toLocaleString('vi-VN')}đ × {value.quantity} × {value.meals.length} {isVi ? 'bữa' : 'meal(s)'})
                  </span>
                </span>
                <span className="font-bold text-primary tabular-nums">{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
            </>
          )}

          {incomplete && (
            <p className="text-xs font-medium text-orange-700 dark:text-orange-300 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {isVi ? 'Vui lòng chọn buổi ăn và combo cho ngày bắt buộc này.' : 'Please pick a meal time and combo for this mandatory day.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DayMealCard;
