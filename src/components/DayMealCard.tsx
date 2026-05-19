import { useState, useMemo, useEffect } from 'react';
import { Sun, Moon, Clock, AlertTriangle, Plus, Minus, ChevronDown, CalendarDays, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { NightInfo } from '@/hooks/useNightlyMandatoryInfo';
import type { ComboPackage, ComboMenu, ComboMenuDish } from '@/hooks/useComboPackages';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export type DayMeal = 'lunch' | 'dinner';

export interface DayMealSelection {
  meals: DayMeal[];
  comboPackageId: string;
  comboMenuId: string;
  quantity: number;
  bypassed?: boolean;
  bypassCode?: string;
}

interface IndividualOption {
  total: number;
  required: number;
  met: boolean;
  onOpenMenu: () => void;
}

interface Props {
  night: NightInfo;
  defaultGuests: number;
  packages: ComboPackage[];
  getMenusByPackage: (pkgId: string) => ComboMenu[];
  getDishesByMenu: (menuId: string) => ComboMenuDish[];
  value: DayMealSelection;
  onChange: (next: DayMealSelection) => void;
  /** Variant: 'mandatory' shows full form; 'optional' renders inline compact toggle */
  variant?: 'mandatory' | 'optional';
  /** When provided on mandatory variant, shows "OR Individual order" block */
  individualOption?: IndividualOption;
}

const emptySel = (qty: number): DayMealSelection => ({
  meals: [], comboPackageId: '', comboMenuId: '', quantity: qty,
});

const DayMealCard = ({ night, defaultGuests, packages, getMenusByPackage, getDishesByMenu, value, onChange, variant }: Props) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const mode: 'mandatory' | 'optional' = variant || (night.mandatory ? 'mandatory' : 'optional');
  const [expanded, setExpanded] = useState<boolean>(mode === 'mandatory' || value.meals.length > 0);

  // Bypass code input
  const [bypassInput, setBypassInput] = useState('');
  const [bypassChecking, setBypassChecking] = useState(false);
  const [bypassError, setBypassError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'mandatory') setExpanded(true);
  }, [mode]);

  const set = (patch: Partial<DayMealSelection>) => onChange({ ...value, ...patch });

  const toggleBoth = () => {
    const both = value.meals.length === 2;
    set({ meals: both ? ['dinner'] : ['lunch', 'dinner'] });
  };
  const pick = (m: DayMeal) => {
    if (value.meals.length === 1 && value.meals[0] === m) return;
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
  const incomplete = mode === 'mandatory' && !isComplete && !value.bypassed;

  const handleApplyBypass = async () => {
    const code = bypassInput.trim();
    if (!code) return;
    setBypassChecking(true);
    setBypassError(null);
    try {
      const { data, error } = await (supabase as any).rpc('use_meal_bypass_code', {
        p_code: code,
        p_date: night.date,
      });
      if (error) throw error;
      if (data && (data as any).valid) {
        onChange({ ...value, bypassed: true, bypassCode: code.toUpperCase() });
        setBypassInput('');
      } else {
        setBypassError((data as any)?.msg || (isVi ? 'Mã không hợp lệ!' : 'Invalid code!'));
      }
    } catch (e: any) {
      setBypassError(e.message || (isVi ? 'Lỗi kiểm tra mã' : 'Error'));
    } finally {
      setBypassChecking(false);
    }
  };

  const clearBypass = () => {
    onChange({ ...value, bypassed: false, bypassCode: undefined });
  };

  // ===== Optional compact variant: just a header + "Add meal" toggle =====
  if (mode === 'optional' && !expanded) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{night.dayLabel}, {night.formattedDate}</span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs font-medium text-primary hover:underline shrink-0"
        >
          + {isVi ? 'Thêm bữa ăn tuỳ chọn' : 'Add meal (optional)'}
        </button>
      </div>
    );
  }

  return (
    <div
      id={`day-meal-${night.date}`}
      className={cn(
        'rounded-xl border p-4 sm:p-5 transition-all',
        mode === 'mandatory'
          ? value.bypassed
            ? 'border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20'
            : incomplete
              ? 'border-orange-300 bg-orange-50/60 dark:bg-orange-950/20'
              : 'border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/10'
          : 'border-border bg-card',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays className={cn('h-4 w-4 shrink-0', mode === 'mandatory' ? 'text-orange-600' : 'text-muted-foreground')} />
          <span className="font-semibold text-sm sm:text-base truncate">
            {night.dayLabel}, {night.formattedDate}
          </span>
          {value.bypassed ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 shrink-0">
              <CheckCircle2 className="h-3 w-3" />
              {isVi ? `Miễn trừ (${value.bypassCode})` : `Bypassed (${value.bypassCode})`}
            </span>
          ) : mode === 'mandatory' ? (
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
        {mode === 'optional' && (
          <button
            type="button"
            onClick={() => {
              onChange(emptySel(defaultGuests));
              setExpanded(false);
            }}
            className="text-xs font-medium text-muted-foreground hover:text-foreground shrink-0"
          >
            {isVi ? 'Thu gọn' : 'Collapse'}
          </button>
        )}
      </div>

      {/* Form (hidden when bypassed) */}
      {!value.bypassed && (
        <div className="mt-4 space-y-4">
          {/* Meal time pills */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">
              {isVi ? 'Chọn buổi ăn' : 'Choose meal time'} {mode === 'mandatory' && <span className="text-orange-600">*</span>}
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
                {isVi ? 'Chọn combo' : 'Choose combo'} {mode === 'mandatory' && <span className="text-orange-600">*</span>}
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

          {/* Bypass code input — only on mandatory cards */}
          {mode === 'mandatory' && (
            <div className="border-t border-border/60 pt-3 mt-1 space-y-2">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1.5">
                <span className="opacity-60">───</span>
                {isVi ? 'HOẶC' : 'OR'}
                <span className="opacity-60">───</span>
              </div>
              <label className="text-xs font-semibold flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-primary" />
                {isVi ? 'Có mã miễn trừ? Nhập vào đây:' : 'Have a bypass code?'}
              </label>
              <div className="flex gap-2">
                <Input
                  value={bypassInput}
                  onChange={e => { setBypassInput(e.target.value.toUpperCase()); setBypassError(null); }}
                  placeholder={isVi ? 'Nhập mã...' : 'Enter code...'}
                  className="h-9 text-sm uppercase"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplyBypass(); } }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyBypass}
                  disabled={bypassChecking || !bypassInput.trim()}
                  className="shrink-0"
                >
                  {bypassChecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (isVi ? 'Xác nhận' : 'Apply')}
                </Button>
              </div>
              {bypassError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {bypassError}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bypass success state */}
      {value.bypassed && (
        <div className="mt-3 space-y-2">
          <div className="rounded-lg bg-emerald-100/70 dark:bg-emerald-950/30 border border-emerald-300 px-3 py-2.5 text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{isVi ? 'Mã hợp lệ — ngày này được bỏ qua.' : 'Code valid — this day is bypassed.'}</span>
          </div>
          <button
            type="button"
            onClick={clearBypass}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            {isVi ? 'Huỷ mã miễn trừ' : 'Remove bypass'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DayMealCard;
