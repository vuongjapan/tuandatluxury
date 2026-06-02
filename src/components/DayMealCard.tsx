import { useState, useMemo, useEffect } from 'react';
import {
  Sun, Moon, Clock, AlertTriangle, Plus, Minus, ChevronDown, CalendarDays,
  CheckCircle2, KeyRound, Loader2, X, Users, ShoppingBag, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { NightInfo } from '@/hooks/useNightlyMandatoryInfo';
import type { ComboPackage, ComboMenu, ComboMenuDish } from '@/hooks/useComboPackages';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ComboDetailPopup from './ComboDetailPopup';
import PersonalMealPlanPopup from './PersonalMealPlanPopup';
import type { FoodItem } from './IndividualFoodSelector';
import type { PersonalMealPlan } from '@/hooks/usePersonalMealPlans';

export type DayMeal = 'lunch' | 'dinner';

export interface DayMealGroup {
  id: string;
  comboPackageId: string;
  comboMenuId: string;
  quantity: number;
}

export interface DayMealSelection {
  meals: DayMeal[];
  /** New: per-day groups (table groups, 6 pax each). Optional for back-compat; auto-migrated. */
  groups?: DayMealGroup[];
  personalSelection?: {
    type: 'personal';
    mealPlanId: string;
    name: string;
    price: number;
    quantity: number;
    setCount: number;
    guestCount: number;
    planGuestCount: number;
    items: string[];
    imageUrl?: string | null;
  };
  // Legacy fields kept for backward-compat reads — UI no longer writes them.
  comboPackageId?: string;
  comboMenuId?: string;
  quantity?: number;
  bypassed?: boolean;
  bypassCode?: string;
}

export const MIN_PER_GROUP = 4;

export const buildDefaultGroups = (adults: number): DayMealGroup[] => {
  const a = Math.max(1, adults);
  // Always start with a SINGLE group containing all guests.
  // Customers can press "+ Add group" to split manually.
  return [{
    id: `g-${Date.now()}-0-${Math.random().toString(36).slice(2, 6)}`,
    comboPackageId: '',
    comboMenuId: '',
    quantity: a,
  }];
};

interface IndividualPerDay {
  total: number;
  required: number;
  met: boolean;
  onOpenMenu?: () => void;
  /** Optional: items list to render inline with × remove buttons */
  items?: FoodItem[];
  onRemoveItem?: (cartKey: string) => void;
  perMeal?: {
    lunch: {
      total: number;
      required: number;
      met: boolean;
      items?: FoodItem[];
      onOpenMenu: () => void;
      onRemoveItem?: (cartKey: string) => void;
    };
    dinner: {
      total: number;
      required: number;
      met: boolean;
      items?: FoodItem[];
      onOpenMenu: () => void;
      onRemoveItem?: (cartKey: string) => void;
    };
  };
}

interface Props {
  night: NightInfo;
  defaultGuests: number;
  packages: ComboPackage[];
  getMenusByPackage: (pkgId: string) => ComboMenu[];
  getDishesByMenu: (menuId: string) => ComboMenuDish[];
  value: DayMealSelection;
  onChange: (next: DayMealSelection) => void;
  variant?: 'mandatory' | 'optional';
  individualOption?: IndividualPerDay;
  personalMealPlans?: PersonalMealPlan[];
  personalMealGuestCount?: number;
}

const ensureGroups = (sel: DayMealSelection, adults: number): DayMealGroup[] => {
  if (sel.groups && sel.groups.length > 0) return sel.groups;
  // migrate from legacy single combo
  if (sel.comboPackageId) {
    return [{
      id: `g-legacy-${Date.now()}`,
      comboPackageId: sel.comboPackageId,
      comboMenuId: sel.comboMenuId || '',
      quantity: sel.quantity || adults,
    }];
  }
  return buildDefaultGroups(adults);
};

const DayMealCard = ({
  night, defaultGuests, packages, getMenusByPackage, getDishesByMenu,
  value, onChange, variant, individualOption,
  personalMealPlans = [], personalMealGuestCount = 0,
}: Props) => {
  const { language, formatPrice } = useLanguage();
  const isVi = language === 'vi';
  const mode: 'mandatory' | 'optional' = variant || (night.mandatory ? 'mandatory' : 'optional');

  const hasAnySelection =
    (value.groups && value.groups.some(g => g.comboPackageId)) ||
    value.bypassed ||
    !!value.comboPackageId ||
    !!value.personalSelection;
  const [expanded, setExpanded] = useState<boolean>(mode === 'mandatory' || hasAnySelection);

  const [bypassInput, setBypassInput] = useState('');
  const [bypassChecking, setBypassChecking] = useState(false);
  const [bypassError, setBypassError] = useState<string | null>(null);
  const [infoPkgId, setInfoPkgId] = useState<string | null>(null);
  const [infoGroupIdx, setInfoGroupIdx] = useState<number | null>(null);
  const [showIndividual, setShowIndividual] = useState(false);
  const [showBypass, setShowBypass] = useState(false);
  const [personalPopupPlan, setPersonalPopupPlan] = useState<PersonalMealPlan | null>(null);
  const [showPersonalSection, setShowPersonalSection] = useState(
    !!value.personalSelection || (personalMealPlans.length > 0 && personalMealGuestCount > 0 && personalMealGuestCount <= 5),
  );

  useEffect(() => {
    if (mode === 'mandatory') setExpanded(true);
  }, [mode]);

  // Migrate legacy state to groups on first render if needed.
  useEffect(() => {
    if (!value.groups) {
      onChange({ ...value, groups: ensureGroups(value, defaultGuests) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch: Partial<DayMealSelection>) => onChange({ ...value, ...patch });

  const toggleBoth = () => {
    const both = value.meals.length === 2;
    set({ meals: both ? ['dinner'] : ['lunch', 'dinner'] });
  };
  const pick = (m: DayMeal) => {
    if (value.meals.length === 1 && value.meals[0] === m) return;
    set({ meals: [m] });
  };

  const groups = value.groups || ensureGroups(value, defaultGuests);

  const updateGroup = (idx: number, patch: Partial<DayMealGroup>) => {
    const next = groups.map((g, i) => (i === idx ? { ...g, ...patch } : g));
    set({ groups: next });
  };

  const removeGroup = (idx: number) => {
    // Allow full removal when the individual-food fallback is already met.
    const individualMet = !!individualOption?.met;
    if (groups.length <= 1) {
      if (individualMet) {
        // Customer can fully drop combos and rely on individual-only food.
        set({ groups: [] });
        return;
      }
      // Reset the only group instead of removing it
      const reset: DayMealGroup = {
        id: `g-${Date.now()}-r`,
        comboPackageId: '',
        comboMenuId: '',
        quantity: defaultGuests,
      };
      set({ groups: [reset] });
      return;
    }
    set({ groups: groups.filter((_, i) => i !== idx) });
  };

  const addGroup = () => {
    set({
      groups: [
        ...groups,
        {
          id: `g-${Date.now()}-add`,
          comboPackageId: '',
          comboMenuId: '',
          quantity: MIN_PER_GROUP,
        },
      ],
    });
  };

  const groupSubtotal = (g: DayMealGroup) => {
    const pkg = packages.find(p => p.id === g.comboPackageId);
    if (!pkg) return 0;
    return pkg.price_per_person * g.quantity * Math.max(1, value.meals.length);
  };

  const totalGroupSubtotal = groups.reduce((s, g) => s + groupSubtotal(g), 0);

  const hasAnyValidGroup = groups.some(g => g.comboPackageId && g.quantity > 0);
  const validGroups = groups.filter(g => g.comboPackageId && g.quantity > 0);
  const totalGroupQty = validGroups.reduce((s, g) => s + g.quantity, 0);
  const anyGroupTooSmall = validGroups.some(g => g.quantity < MIN_PER_GROUP);
  const groupsCoverGuests = totalGroupQty >= defaultGuests;
  const groupsValid = hasAnyValidGroup && !anyGroupTooSmall && groupsCoverGuests;
  const isComplete = value.meals.length > 0 && groupsValid;
  const individualMet = !!individualOption?.met;
  const incomplete = mode === 'mandatory' && !isComplete && !value.bypassed && !individualMet;


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

  // ===== Optional compact variant =====
  if (mode === 'optional' && !expanded) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">
            {night.dayLabel}, {night.formattedDate}
          </span>
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
          <CalendarDays
            className={cn(
              'h-4 w-4 shrink-0',
              mode === 'mandatory' ? 'text-orange-600' : 'text-muted-foreground',
            )}
          />
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
              onChange({
                meals: [],
                groups: buildDefaultGroups(defaultGuests),
                bypassed: false,
                bypassCode: undefined,
              });
              setExpanded(false);
            }}
            className="text-xs font-medium text-muted-foreground hover:text-foreground shrink-0"
          >
            {isVi ? 'Thu gọn' : 'Collapse'}
          </button>
        )}
      </div>

      {/* Form */}
      {!value.bypassed && (
        <div className="mt-4 space-y-4">
          {/* Meal time pills */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">
              {isVi ? 'Chọn buổi ăn' : 'Choose meal time'}{' '}
              {mode === 'mandatory' && <span className="text-orange-600">*</span>}
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
                      active
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                        : 'border-border hover:border-primary/50 bg-card',
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon
                        className={cn('h-3.5 w-3.5', active ? 'text-primary' : 'text-muted-foreground')}
                      />
                      <span className={cn('text-xs font-semibold', active ? 'text-primary' : 'text-foreground')}>
                        {opt.label}
                      </span>
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
                      active
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                        : 'border-border hover:border-primary/50 bg-card',
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <Clock
                        className={cn('h-3.5 w-3.5', active ? 'text-primary' : 'text-muted-foreground')}
                      />
                      <span className={cn('text-xs font-semibold', active ? 'text-primary' : 'text-foreground')}>
                        {isVi ? 'Cả 2 bữa' : 'Both meals'}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {isVi ? '× 2 giá' : '× 2 price'}
                    </span>
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Groups */}
          {value.meals.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {isVi ? 'Combo theo nhóm bàn' : 'Combo per group'}{' '}
                {mode === 'mandatory' && <span className="text-orange-600">*</span>}
                <span className="text-[10px] font-normal text-muted-foreground/80 normal-case">
                  ({isVi ? `mỗi nhóm tối thiểu ${MIN_PER_GROUP} suất` : `min ${MIN_PER_GROUP} servings / group`})
                </span>
              </label>


              <div className="space-y-2.5">
                {groups.map((g, gi) => {
                  const menusForG = g.comboPackageId ? getMenusByPackage(g.comboPackageId) : [];
                  const dishes = g.comboMenuId ? getDishesByMenu(g.comboMenuId) : [];
                  const pkg = packages.find(p => p.id === g.comboPackageId);
                  return (
                    <div
                      key={g.id}
                      className="rounded-lg border border-border/80 bg-muted/30 p-2.5 sm:p-3 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold flex items-center gap-1.5">
                          🪑 {isVi ? `Nhóm ${gi + 1}` : `Group ${gi + 1}`}
                          <span className="text-[11px] font-normal text-muted-foreground">
                            — {g.quantity} {isVi ? 'người' : 'pax'}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeGroup(gi)}
                          className="text-[11px] font-medium text-destructive/70 hover:text-destructive border border-destructive/30 hover:border-destructive/60 rounded px-1.5 py-0.5 flex items-center gap-1 transition"
                        >
                          <X className="h-3 w-3" />
                          {isVi ? 'Xoá nhóm' : 'Remove'}
                        </button>
                      </div>

                      {/* Combo grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {packages.map(p => {
                          const active = g.comboPackageId === p.id;
                          return (
                            <div
                              key={p.id}
                              className={cn(
                                'relative rounded-md border transition-all',
                                active
                                  ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                                  : 'border-border hover:border-primary/50 bg-card',
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  const firstMenu = getMenusByPackage(p.id)[0];
                                  updateGroup(gi, {
                                    comboPackageId: p.id,
                                    comboMenuId: firstMenu?.id || '',
                                  });
                                }}
                                className="w-full p-1.5 pr-6 text-left"
                              >
                                <div
                                  className={cn(
                                    'text-[11px] font-semibold leading-tight',
                                    active ? 'text-primary' : 'text-foreground',
                                  )}
                                >
                                  {p.name}
                                </div>
                                <div className="text-[10px] text-muted-foreground tabular-nums">
                                  {p.price_per_person.toLocaleString('vi-VN')}đ
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setInfoPkgId(p.id); setInfoGroupIdx(gi); }}
                                className="absolute top-1 right-1 p-0.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                                aria-label="combo info"
                                title={isVi ? 'Xem chi tiết combo' : 'View combo details'}
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Menu select */}
                      {g.comboPackageId && menusForG.length > 0 && (
                        <div>
                          <div className="relative">
                            <select
                              value={g.comboMenuId}
                              onChange={e => updateGroup(gi, { comboMenuId: e.target.value })}
                              className="w-full appearance-none rounded-md border border-border bg-card px-2.5 py-1.5 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                              {menusForG.map(m => (
                                <option key={m.id} value={m.id}>
                                  {isVi
                                    ? `Thực đơn ${m.menu_number} — ${m.name_vi}`
                                    : `Menu ${m.menu_number} — ${m.name_en || m.name_vi}`}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                          </div>
                          {dishes.length > 0 && (
                            <ul className="mt-1.5 space-y-0.5">
                              {dishes.map(d => (
                                <li
                                  key={d.id}
                                  className="text-[11px] text-muted-foreground/90 leading-snug flex items-start gap-1.5"
                                >
                                  <span className="text-primary/70 mt-0.5">•</span>
                                  <span>{isVi ? d.name_vi : d.name_en || d.name_vi}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* Quantity + subtotal */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">
                            {isVi ? 'Số suất:' : 'Servings:'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateGroup(gi, { quantity: Math.max(1, g.quantity - 1) })
                            }
                            disabled={g.quantity <= 1}
                            className={cn(
                              'w-6 h-6 rounded-full border border-border flex items-center justify-center transition',
                              g.quantity <= 1
                                ? 'opacity-30 cursor-not-allowed'
                                : 'hover:border-primary',
                            )}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-bold w-6 text-center tabular-nums text-sm">
                            {g.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateGroup(gi, { quantity: g.quantity + 1 })}
                            className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        {pkg && (
                          <span className="text-xs font-semibold text-primary tabular-nums">
                            {(pkg.price_per_person * g.quantity * Math.max(1, value.meals.length))
                              .toLocaleString('vi-VN')}
                            đ
                          </span>
                        )}
                      </div>

                      {g.comboPackageId && g.quantity < MIN_PER_GROUP && (
                        <p className="text-[11px] font-medium text-destructive flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {isVi
                            ? `Mỗi nhóm bàn cần tối thiểu ${MIN_PER_GROUP} suất để đặt món`
                            : `Each group must have at least ${MIN_PER_GROUP} servings`}
                        </p>
                      )}
                    </div>
                  );
                })}


                <button
                  type="button"
                  onClick={addGroup}
                  className="w-full border-2 border-dashed border-border hover:border-primary rounded-lg py-2 text-xs font-medium text-muted-foreground hover:text-primary transition"
                >
                  + {isVi ? 'Thêm nhóm bàn' : 'Add a group'}
                </button>
              </div>

              {hasAnyValidGroup && !groupsCoverGuests && (
                <p className="mt-2 text-[11px] font-medium text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {isVi
                    ? `Tổng số suất (${totalGroupQty}) chưa đủ cho ${defaultGuests} khách. Cần thêm ${defaultGuests - totalGroupQty} suất.`
                    : `Total servings (${totalGroupQty}) is less than ${defaultGuests} guests. Need ${defaultGuests - totalGroupQty} more.`}
                </p>
              )}

              {totalGroupSubtotal > 0 && (
                <div className="bg-primary/5 rounded-lg p-2.5 flex items-center justify-between text-sm mt-2.5">
                  <span className="text-muted-foreground">
                    {isVi ? 'Tạm tính combo' : 'Combo subtotal'} ×{' '}
                    {value.meals.length} {isVi ? 'bữa' : 'meal(s)'}
                  </span>
                  <span className="font-bold text-primary tabular-nums">
                    {totalGroupSubtotal.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              )}
            </div>
          )}


          {incomplete && !individualOption?.met && (
            <p className="text-xs font-medium text-orange-700 dark:text-orange-300 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {isVi
                ? 'Vui lòng chọn buổi ăn + combo, đặt món riêng đủ mức, hoặc nhập mã miễn trừ.'
                : 'Please pick meal + combo, order enough à la carte, or enter a bypass code.'}
            </p>
          )}

          {/* Individual Order per-day (collapsible) */}
          {individualOption && (
            <div className="border border-border/70 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowIndividual(v => !v)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-muted/40 hover:bg-muted/60 transition text-left"
              >
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                  {isVi ? 'Đặt món riêng (ngày này)' : 'À la carte (this day)'}
                  {individualOption.met && (
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full">
                      {isVi ? 'Đủ mức' : 'Met'}
                    </span>
                  )}
                  {!individualOption.met && individualOption.total > 0 && (
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full tabular-nums">
                      {individualOption.total.toLocaleString('vi-VN')}đ
                    </span>
                  )}
                </span>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform shrink-0', showIndividual && 'rotate-180')} />
              </button>

              {showIndividual && (
                <div className="p-3 space-y-2 border-t border-border/60 bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {mode === 'mandatory' && (
                        <p className="text-[11px] text-muted-foreground">
                          {isVi
                            ? `Tối thiểu ${individualOption.required.toLocaleString('vi-VN')}đ để bỏ qua combo`
                            : `Min ${individualOption.required.toLocaleString('vi-VN')}đ to skip combo`}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={individualOption.onOpenMenu}
                      className="shrink-0"
                    >
                      {isVi ? 'Mở menu' : 'Open menu'}
                    </Button>
                  </div>

                  {individualOption.items && individualOption.items.length > 0 && (
                    <div className="space-y-1 border-t border-border/50 pt-2">
                      {individualOption.items.map(f => {
                        const isNeg = f.priceType === 'negotiable' || f.price === 0;
                        return (
                          <div
                            key={f.id}
                            className="flex items-center justify-between gap-2 text-xs py-0.5"
                          >
                            <span className="min-w-0 truncate">
                              {f.name}
                              {f.priceLabel ? ` (${f.priceLabel})` : ''} × {f.quantity}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="tabular-nums text-muted-foreground">
                                {isNeg ? (isVi ? 'Thoả thuận' : 'On request') : `${(f.price * f.quantity).toLocaleString('vi-VN')}đ`}
                              </span>
                              {individualOption.onRemoveItem && (
                                <button
                                  type="button"
                                  onClick={() => individualOption.onRemoveItem?.(f.id)}
                                  className="text-destructive/60 hover:text-destructive p-0.5"
                                  aria-label="remove"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {mode === 'mandatory' && (
                    <div className="space-y-1 pt-1">
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'absolute inset-y-0 left-0 transition-all duration-300 rounded-full',
                            individualOption.met ? 'bg-emerald-500' : 'bg-primary',
                          )}
                          style={{
                            width: `${Math.min(100, (individualOption.total / Math.max(1, individualOption.required)) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] tabular-nums">
                        <span
                          className={cn(
                            'font-semibold',
                            individualOption.met ? 'text-emerald-600' : 'text-foreground',
                          )}
                        >
                          {individualOption.total.toLocaleString('vi-VN')}đ
                        </span>
                        <span className="text-muted-foreground">
                          / {individualOption.required.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      {individualOption.met ? (
                        <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {isVi ? 'Đủ điều kiện — không cần chọn combo!' : 'Minimum met — combo not required!'}
                        </p>
                      ) : individualOption.total > 0 ? (
                        <p className="text-[11px] text-muted-foreground">
                          {isVi
                            ? `Cần thêm ${(individualOption.required - individualOption.total).toLocaleString('vi-VN')}đ`
                            : `Need ${(individualOption.required - individualOption.total).toLocaleString('vi-VN')}đ more`}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bypass code (collapsible) */}
          {mode === 'mandatory' && (
            <div className="border border-border/70 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowBypass(v => !v)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-muted/40 hover:bg-muted/60 transition text-left"
              >
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-primary" />
                  {isVi ? 'Có mã miễn trừ?' : 'Have a bypass code?'}
                </span>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform shrink-0', showBypass && 'rotate-180')} />
              </button>
              {showBypass && (
                <div className="p-3 space-y-2 border-t border-border/60 bg-card">
                  <div className="flex gap-2">
                    <Input
                      value={bypassInput}
                      onChange={e => {
                        setBypassInput(e.target.value.toUpperCase());
                        setBypassError(null);
                      }}
                      placeholder={isVi ? 'Nhập mã...' : 'Enter code...'}
                      className="h-9 text-sm uppercase"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyBypass();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApplyBypass}
                      disabled={bypassChecking || !bypassInput.trim()}
                      className="shrink-0"
                    >
                      {bypassChecking ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isVi ? 'Xác nhận' : 'Apply'}
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
        </div>
      )}

      {/* Bypass success */}
      {value.bypassed && (
        <div className="mt-3 space-y-2">
          <div className="rounded-lg bg-emerald-100/70 dark:bg-emerald-950/30 border border-emerald-300 px-3 py-2.5 text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              {isVi ? 'Mã hợp lệ — ngày này được bỏ qua.' : 'Code valid — this day is bypassed.'}
            </span>
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

      <ComboDetailPopup
        open={!!infoPkgId}
        onClose={() => { setInfoPkgId(null); setInfoGroupIdx(null); }}
        pkg={infoPkgId ? packages.find(p => p.id === infoPkgId) || null : null}
        menus={infoPkgId ? getMenusByPackage(infoPkgId) : []}
        getDishesByMenu={getDishesByMenu}
        onSelect={(pkgId) => {
          const targetIdx = infoGroupIdx ?? 0;
          const firstMenu = getMenusByPackage(pkgId)[0];
          if (groups[targetIdx]) {
            updateGroup(targetIdx, { comboPackageId: pkgId, comboMenuId: firstMenu?.id || '' });
          }
        }}
      />
    </div>
  );
};

export default DayMealCard;
