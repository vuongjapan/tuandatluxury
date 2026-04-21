import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Plus, Minus, Eye, Trash2, Users, BookOpen } from 'lucide-react';
import MenuViewerModal from '@/components/MenuViewerModal';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useComboPackages, ComboPackage, ComboMenu } from '@/hooks/useComboPackages';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

/**
 * One combo slot the guest configures: package + menu + how many of the group
 * will eat this combo. The price is `pricePerPerson * people` — no minimum-6
 * multiplier. Each slot must pick a different combo package.
 */
export interface ComboSlot {
  packageId: string;
  packageName: string;
  pricePerPerson: number;
  menuId: string;
  menuName: string;
  menuNumber: number;
  dishes: string[];
  people: number;
}

interface Props {
  guestCount: number;
  slots: ComboSlot[];
  onChange: (slots: ComboSlot[]) => void;
  sectionId?: string;
  shake?: boolean;
}

const ComboSlotSelector = ({ guestCount, slots, onChange, sectionId, shake }: Props) => {
  const { packages, loading, getMenusByPackage, getDishesByMenu } = useComboPackages();
  const { language, formatPrice } = useLanguage();
  const isVi = language === 'vi';

  // Number of slots = ceil(g / 6) — each combo group seats up to 6 by default
  const maxGroups = Math.max(1, Math.ceil(guestCount / 6));

  const [previewPkg, setPreviewPkg] = useState<ComboPackage | null>(null);
  const [fullMenuOpen, setFullMenuOpen] = useState(false);

  // Make sure we always have exactly `maxGroups` slots — fill with empty placeholders.
  // Empty = packageId === '' (user hasn't picked yet).
  useEffect(() => {
    if (loading) return;
    if (slots.length === maxGroups) return;
    if (slots.length < maxGroups) {
      // Pad with empties — distribute remaining people evenly across new slots.
      const assigned = slots.reduce((s, x) => s + x.people, 0);
      const left = Math.max(0, guestCount - assigned);
      const newSlots = Array.from({ length: maxGroups - slots.length }, (_, i) => {
        const isLast = i === maxGroups - slots.length - 1;
        const evenly = Math.floor(left / (maxGroups - slots.length));
        const people = isLast ? Math.max(1, left - evenly * (maxGroups - slots.length - 1)) : Math.max(1, evenly);
        return {
          packageId: '', packageName: '', pricePerPerson: 0,
          menuId: '', menuName: '', menuNumber: 0, dishes: [],
          people,
        } as ComboSlot;
      });
      onChange([...slots, ...newSlots]);
    } else {
      // Trim extras (guest count went down)
      onChange(slots.slice(0, maxGroups));
    }
  }, [maxGroups, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const assigned = useMemo(() => slots.reduce((s, x) => s + (x.people || 0), 0), [slots]);
  const filledSlots = slots.filter(s => s.packageId);
  const slotsTotal = useMemo(
    () => filledSlots.reduce((s, x) => s + x.pricePerPerson * x.people, 0),
    [filledSlots]
  );

  const updateSlot = (idx: number, patch: Partial<ComboSlot>) => {
    const next = slots.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    onChange(next);
  };

  const setSlotPackage = (idx: number, pkg: ComboPackage) => {
    const menus = getMenusByPackage(pkg.id);
    const firstMenu = menus[0];
    const dishes = firstMenu ? getDishesByMenu(firstMenu.id) : [];
    updateSlot(idx, {
      packageId: pkg.id,
      packageName: pkg.name,
      pricePerPerson: pkg.price_per_person,
      menuId: firstMenu?.id || '',
      menuName: firstMenu ? (isVi ? firstMenu.name_vi : firstMenu.name_en) : '',
      menuNumber: firstMenu?.menu_number || 0,
      dishes: dishes.map(d => (isVi ? d.name_vi : d.name_en)),
    });
  };

  const setSlotMenu = (idx: number, menu: ComboMenu) => {
    const dishes = getDishesByMenu(menu.id);
    updateSlot(idx, {
      menuId: menu.id,
      menuName: isVi ? menu.name_vi : menu.name_en,
      menuNumber: menu.menu_number,
      dishes: dishes.map(d => (isVi ? d.name_vi : d.name_en)),
    });
  };

  const adjustPeople = (idx: number, delta: number) => {
    const next = Math.max(1, slots[idx].people + delta);
    updateSlot(idx, { people: next });
  };

  const clearSlot = (idx: number) => {
    updateSlot(idx, { packageId: '', packageName: '', pricePerPerson: 0, menuId: '', menuName: '', menuNumber: 0, dishes: [] });
  };

  const remaining = guestCount - assigned;
  const assignedOk = assigned === guestCount;

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse space-y-3">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-32 bg-muted rounded-xl" />
      </div>
    );
  }

  if (packages.length === 0) return null;

  return (
    <div
      id={sectionId}
      className={cn(
        'bg-card rounded-xl border border-border p-5 sm:p-6 space-y-4 transition-all',
        shake && 'combo-required-shake'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="h-5 w-5 text-primary" />
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-lg sm:text-xl font-semibold">
            {isVi ? 'Combo ăn uống cho đoàn' : 'Group meal combos'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isVi
              ? `Đoàn ${guestCount} khách → ${maxGroups} combo (mỗi nhóm chọn 1 loại khác nhau)`
              : `${guestCount} guests → ${maxGroups} combo${maxGroups > 1 ? 's' : ''} (each group picks a different combo)`}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 shrink-0 text-xs"
          onClick={() => setFullMenuOpen(true)}
        >
          <BookOpen className="h-3.5 w-3.5" />
          {isVi ? 'Xem thực đơn' : 'View menu'}
        </Button>
      </div>

      {/* Progress: assigned / guestCount */}
      <div
        className={cn(
          'rounded-lg p-3 flex items-center justify-between gap-2 text-sm border',
          assignedOk
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300'
        )}
      >
        <span className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0" />
          {isVi
            ? `Đã phân: ${assigned}/${guestCount} khách`
            : `Assigned: ${assigned}/${guestCount} guests`}
        </span>
        {!assignedOk && (
          <span className="text-xs font-bold">
            {remaining > 0
              ? (isVi ? `Thiếu ${remaining}` : `${remaining} left`)
              : (isVi ? `Dư ${-remaining}` : `${-remaining} over`)}
          </span>
        )}
      </div>

      {/* Slots */}
      <div className="space-y-3">
        {slots.map((slot, idx) => {
          // packages already used in OTHER slots — hide them in this slot's dropdown
          const usedElsewhere = new Set(
            slots.filter((_, i) => i !== idx).map(s => s.packageId).filter(Boolean)
          );
          const availablePkgs = packages.filter(
            p => !usedElsewhere.has(p.id) || p.id === slot.packageId
          );
          const currentPkg = packages.find(p => p.id === slot.packageId) || null;
          const currentMenus = currentPkg ? getMenusByPackage(currentPkg.id) : [];
          const lineTotal = slot.pricePerPerson * slot.people;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'rounded-xl border p-3 sm:p-4 space-y-3 transition-colors',
                slot.packageId ? 'border-primary/40 bg-primary/5' : 'border-dashed border-border bg-muted/30'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-primary/15 text-primary rounded-full h-6 min-w-6 px-2 inline-flex items-center justify-center">
                  {isVi ? `Nhóm ${idx + 1}` : `Group ${idx + 1}`}
                </span>
                {slot.packageId && (
                  <button
                    type="button"
                    onClick={() => clearSlot(idx)}
                    className="ml-auto text-muted-foreground hover:text-destructive text-xs inline-flex items-center gap-1"
                    aria-label="Clear"
                  >
                    <Trash2 className="h-3 w-3" /> {isVi ? 'Xóa' : 'Clear'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-end">
                {/* Combo package dropdown */}
                <div className="sm:col-span-6 min-w-0">
                  <label className="text-[11px] uppercase font-semibold text-muted-foreground block mb-1">
                    {isVi ? 'Loại combo' : 'Combo type'}
                  </label>
                  <Select
                    value={slot.packageId || ''}
                    onValueChange={pid => {
                      const pkg = packages.find(p => p.id === pid);
                      if (pkg) setSlotPackage(idx, pkg);
                    }}
                  >
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder={isVi ? 'Chọn combo...' : 'Pick combo...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePkgs.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-sm">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-muted-foreground ml-2">{formatPrice(p.price_per_person)}/{isVi ? 'người' : 'pax'}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* People stepper */}
                <div className="sm:col-span-3">
                  <label className="text-[11px] uppercase font-semibold text-muted-foreground block mb-1">
                    {isVi ? 'Số người' : 'People'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => adjustPeople(idx, -1)}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="font-bold text-base w-10 text-center tabular-nums">{slot.people}</span>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => adjustPeople(idx, 1)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Line total */}
                <div className="sm:col-span-3 text-right">
                  <p className="text-[11px] uppercase font-semibold text-muted-foreground mb-1">
                    {isVi ? 'Tạm tính' : 'Subtotal'}
                  </p>
                  <p className="font-bold text-primary tabular-nums">{formatPrice(lineTotal)}</p>
                </div>
              </div>

              {/* Menu picker (only after package chosen) */}
              {currentPkg && currentMenus.length > 0 && (
                <div className="border-t border-primary/15 pt-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] uppercase font-semibold text-muted-foreground">
                      {isVi ? `Chọn thực đơn (${currentMenus.length})` : `Pick menu (${currentMenus.length})`}
                    </label>
                    <button
                      type="button"
                      onClick={() => setPreviewPkg(currentPkg)}
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" /> {isVi ? 'Xem tất cả thực đơn' : 'View all menus'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {currentMenus.map(m => {
                      const active = m.id === slot.menuId;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSlotMenu(idx, m)}
                          className={cn(
                            'rounded-lg border px-2 py-1.5 text-xs text-left transition-colors',
                            active
                              ? 'border-primary bg-primary/10 text-primary font-semibold'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <div className="font-semibold">#{m.menu_number}</div>
                          <div className="truncate text-[11px] opacity-80">{isVi ? m.name_vi : m.name_en}</div>
                        </button>
                      );
                    })}
                  </div>
                  {slot.dishes.length > 0 && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {slot.dishes.slice(0, 6).join(' • ')}{slot.dishes.length > 6 ? '…' : ''}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Slots total */}
      {filledSlots.length > 0 && (
        <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
          <span className="font-medium">{isVi ? 'Tổng combo' : 'Combos total'}</span>
          <span className="font-bold text-primary text-base tabular-nums">{formatPrice(slotsTotal)}</span>
        </div>
      )}

      {/* Menu preview dialog */}
      <Dialog open={!!previewPkg} onOpenChange={o => !o && setPreviewPkg(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewPkg?.name}</DialogTitle>
          </DialogHeader>
          {previewPkg && (
            <div className="space-y-3">
              {getMenusByPackage(previewPkg.id).map(m => (
                <div key={m.id} className="rounded-lg border border-border p-3">
                  <p className="font-semibold text-sm">
                    #{m.menu_number} – {isVi ? m.name_vi : m.name_en}
                  </p>
                  <ol className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {getDishesByMenu(m.id).map(d => (
                      <li key={d.id}>• {isVi ? d.name_vi : d.name_en}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MenuViewerModal open={fullMenuOpen} onClose={() => setFullMenuOpen(false)} />
    </div>
  );
};

export default ComboSlotSelector;
