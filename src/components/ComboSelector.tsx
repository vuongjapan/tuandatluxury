import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UtensilsCrossed, ArrowLeft, Check, ChevronRight, AlertTriangle, Minus, Plus, Info, ShoppingBag, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useComboPackages, ComboPackage, ComboMenu } from '@/hooks/useComboPackages';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMemberDiscount } from '@/hooks/useMemberDiscount';
import { cn } from '@/lib/utils';

export interface ComboSelection {
  packageId: string;
  packageName: string;
  pricePerPerson: number;
  menuId: string;
  menuName: string;
  menuNumber: number;
  dishes: string[];
  quantity: number;
}

interface ComboSelectorProps {
  required?: boolean;
  selections: ComboSelection[];
  onSelectionsChange: (selections: ComboSelection[]) => void;
  guestCount: number;
  comboNotes: string;
  onComboNotesChange: (notes: string) => void;
  onOpenFoodOrder?: () => void;
}

const NOTES_SUGGESTIONS = [
  'Khách ăn khác khẩu phần',
  'Có trẻ em / người ăn ít',
  'Đoàn muốn trải nghiệm nhiều menu',
];

const ComboSelector = ({ required, selections, onSelectionsChange, guestCount, comboNotes, onComboNotesChange, onOpenFoodOrder }: ComboSelectorProps) => {
  const { packages, loading, getMenusByPackage, getDishesByMenu } = useComboPackages();
  const { language, formatPrice } = useLanguage();
  const { perPerson } = useMemberDiscount();
  const isVi = language === 'vi';
  const perPersonMode = perPerson.enabled;

  const [step, setStep] = useState<'list' | 'menus'>('list');
  const [selectedPkg, setSelectedPkg] = useState<ComboPackage | null>(null);
  const [tempQuantity, setTempQuantity] = useState(1);
  // Toggle: skip vs add — default ON if required, else off (skip)
  const [enabled, setEnabled] = useState<boolean>(!!required || selections.length > 0);
  // View-menu modal
  const [previewPkg, setPreviewPkg] = useState<ComboPackage | null>(null);

  const totalComboServings = selections.reduce((sum, s) => sum + s.quantity, 0);
  const remainingServings = guestCount - totalComboServings;
  const hasMultipleTypes = selections.length >= 2;
  const needsNotes = hasMultipleTypes && !comboNotes.trim();

  const handleSelectPackage = (pkg: ComboPackage) => {
    setSelectedPkg(pkg);
    // Per-person mode: 1 menu = 1 person, default qty = guest count for single combo
    setTempQuantity(perPersonMode ? guestCount : Math.max(1, remainingServings));
    setStep('menus');
  };

  const handleSelectMenu = (menu: ComboMenu) => {
    if (!selectedPkg) return;
    const menuDishes = getDishesByMenu(menu.id);
    const qty = Math.min(tempQuantity, Math.max(1, remainingServings));
    
    // Check if same package+menu already exists
    const existingIdx = selections.findIndex(
      s => s.packageId === selectedPkg.id && s.menuId === menu.id
    );

    if (existingIdx >= 0) {
      const updated = [...selections];
      updated[existingIdx] = { ...updated[existingIdx], quantity: updated[existingIdx].quantity + qty };
      onSelectionsChange(updated);
    } else {
      onSelectionsChange([...selections, {
        packageId: selectedPkg.id,
        packageName: selectedPkg.name,
        pricePerPerson: selectedPkg.price_per_person,
        menuId: menu.id,
        menuName: isVi ? menu.name_vi : menu.name_en,
        menuNumber: menu.menu_number,
        dishes: menuDishes.map(d => isVi ? d.name_vi : d.name_en),
        quantity: qty,
      }]);
    }
    setStep('list');
    setSelectedPkg(null);
  };

  const handleBack = () => {
    setStep('list');
    setSelectedPkg(null);
  };

  const removeCombo = (idx: number) => {
    onSelectionsChange(selections.filter((_, i) => i !== idx));
  };

  const updateQty = (idx: number, delta: number) => {
    const updated = [...selections];
    const newQty = Math.max(1, updated[idx].quantity + delta);
    updated[idx] = { ...updated[idx], quantity: newQty };
    onSelectionsChange(updated);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Combo ăn uống</h2>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (packages.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
      {/* Header with Skip/Add toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-display text-lg sm:text-xl font-semibold">
              {isVi ? 'Thêm bữa ăn' : 'Add meal'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {required
                ? (isVi ? 'Bắt buộc với ngày bạn chọn' : 'Required for your dates')
                : (isVi ? 'Không bắt buộc' : 'Optional')}
            </p>
          </div>
          {required && (
            <span className="bg-primary/15 text-primary text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {isVi ? 'Bắt buộc' : 'Required'}
            </span>
          )}
        </div>
        {!required && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{isVi ? 'Bỏ qua' : 'Skip'}</span>
            <Switch
              checked={enabled}
              onCheckedChange={(v) => {
                setEnabled(v);
                if (!v) onSelectionsChange([]);
              }}
            />
            <span className="text-xs text-muted-foreground">{isVi ? 'Thêm' : 'Add'}</span>
          </div>
        )}
      </div>

      {!enabled && !required && (
        <div className="bg-muted/40 rounded-lg p-3 text-sm text-muted-foreground text-center">
          {isVi ? '🍽️ Bỏ qua bữa ăn — bạn có thể đặt sau khi nhận phòng' : '🍽️ Skipped — order later at check-in'}
        </div>
      )}

      {(enabled || required) && perPersonMode && (
        <div className="bg-chart-2/5 border border-chart-2/30 rounded-lg p-3 text-sm text-foreground">
          {isVi ? `Mỗi khách 1 thực đơn riêng · ${guestCount} khách.` : `1 menu per guest · ${guestCount} guests.`}
        </div>
      )}

      {(enabled || required) && (
        <>
          {/* Servings tracker */}
          <div className={cn(
            "rounded-lg p-3 text-sm flex items-center justify-between",
            totalComboServings === guestCount ? "bg-chart-2/10 border border-chart-2/30" :
            totalComboServings > guestCount ? "bg-destructive/10 border border-destructive/30" :
            "bg-muted/50 border border-border"
          )}>
            <span className="flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0" />
              <span>
                {isVi ? `Đã chọn ${totalComboServings}/${guestCount} suất` : `${totalComboServings}/${guestCount} servings`}
              </span>
            </span>
            {totalComboServings === guestCount && <span className="text-chart-2 font-bold text-xs">✅ {isVi ? 'Đủ' : 'OK'}</span>}
            {totalComboServings > guestCount && <span className="text-destructive font-bold text-xs">⚠️ +{totalComboServings - guestCount}</span>}
          </div>

          {/* Selected combos list */}
          {selections.length > 0 && step === 'list' && (
            <div className="space-y-2">
              {selections.map((sel, idx) => (
                <motion.div
                  key={`${sel.packageId}-${sel.menuId}-${idx}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/5 border border-primary/40 rounded-lg p-3 flex items-center gap-3"
                >
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground text-sm truncate">{sel.packageName} – {sel.menuName}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{sel.dishes.slice(0, 4).join(' • ')}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(idx, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="font-bold text-sm w-6 text-center">{sel.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(idx, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-primary font-bold text-sm shrink-0 w-24 text-right">
                    {formatPrice(sel.pricePerPerson * sel.quantity)}
                  </span>
                  <button onClick={() => removeCombo(idx)} className="text-muted-foreground hover:text-destructive shrink-0 text-sm" aria-label="Remove">✕</button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Notes for multiple combo types */}
          {hasMultipleTypes && step === 'list' && (
            <div className="bg-secondary/40 border border-border rounded-lg p-3 space-y-2">
              <p className="text-sm font-semibold">
                📝 {isVi ? 'Ghi chú yêu cầu ăn uống' : 'Dining notes'} {!comboNotes.trim() && <span className="text-muted-foreground text-xs">({isVi ? 'không bắt buộc' : 'optional'})</span>}
              </p>
              <Textarea
                value={comboNotes}
                onChange={e => onComboNotesChange(e.target.value)}
                placeholder={isVi ? 'VD: trẻ em ăn ít, dị ứng hải sản...' : 'E.g. less for kids, seafood allergy...'}
                rows={2}
                className="text-sm"
              />
              <div className="flex flex-wrap gap-1.5">
                {NOTES_SUGGESTIONS.map(s => (
                  <Button key={s} variant="outline" size="sm" className="text-xs h-7"
                    onClick={() => onComboNotesChange(comboNotes ? `${comboNotes}, ${s.toLowerCase()}` : s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* LIST MODE: combo packages as rows */}
            {step === 'list' && (remainingServings > 0 || selections.length === 0) && (
              <motion.div
                key="packages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {selections.length > 0 && remainingServings > 0 && (
                  <p className="text-sm font-medium text-primary">
                    ➕ {isVi ? `Thêm cho ${remainingServings} suất còn lại` : `Add for ${remainingServings} more`}
                  </p>
                )}
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="rounded-lg border border-border hover:border-primary/50 transition-colors p-3 flex items-center gap-3 flex-wrap"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{pkg.name}</h3>
                        <span className="text-[11px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                          {pkg.menu_count} {isVi ? 'thực đơn' : 'menus'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {isVi ? pkg.description_vi : pkg.description_en}
                      </p>
                      <button
                        type="button"
                        onClick={() => setPreviewPkg(pkg)}
                        className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" /> {isVi ? 'Xem thực đơn' : 'View menus'} →
                      </button>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary">{formatPrice(pkg.price_per_person)}</p>
                      <p className="text-[10px] text-muted-foreground">/{isVi ? 'suất' : 'serving'}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="gold"
                      className="shrink-0 gap-1"
                      onClick={() => handleSelectPackage(pkg)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {isVi ? 'Chọn' : 'Pick'}
                    </Button>
                  </div>
                ))}
              </motion.div>
            )}

            {/* STEP 2: Choose menu within package */}
            {step === 'menus' && selectedPkg && (
              <motion.div
                key="menus"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
                    <ArrowLeft className="h-4 w-4" /> {isVi ? 'Quay lại' : 'Back'}
                  </Button>
                  <div>
                    <h3 className="font-display text-lg font-bold">{selectedPkg.name}</h3>
                    <p className="text-sm text-primary font-medium">{formatPrice(selectedPkg.price_per_person)}/{isVi ? 'suất' : 'serving'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                  <span className="text-sm font-medium">{isVi ? 'Số suất:' : 'Quantity:'}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTempQuantity(Math.max(1, tempQuantity - 1))}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="font-bold text-lg w-8 text-center">{tempQuantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTempQuantity(tempQuantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <span className="ml-auto text-sm text-muted-foreground">
                    = {formatPrice(selectedPkg.price_per_person * tempQuantity)}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground font-medium">
                  {isVi ? `Chọn 1 trong ${selectedPkg.menu_count} thực đơn:` : `Choose 1 of ${selectedPkg.menu_count} menus:`}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getMenusByPackage(selectedPkg.id).map((menu) => {
                    const menuDishes = getDishesByMenu(menu.id);
                    return (
                      <motion.div
                        key={menu.id}
                        whileHover={{ y: -2 }}
                        className="rounded-xl border border-border p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all group"
                        onClick={() => handleSelectMenu(menu)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-display font-bold text-foreground">{isVi ? menu.name_vi : menu.name_en}</h4>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                            {menuDishes.length} {isVi ? 'món' : 'dishes'}
                          </span>
                        </div>
                        <ol className="space-y-1.5">
                          {menuDishes.map((dish, i) => (
                            <li key={dish.id} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-xs font-bold text-foreground/50 w-5 shrink-0 text-right">{i + 1}.</span>
                              <span>{isVi ? dish.name_vi : dish.name_en}</span>
                            </li>
                          ))}
                        </ol>
                        <Button variant="outline" size="sm" className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Check className="h-4 w-4 mr-1" />
                          {isVi ? 'Chọn thực đơn này' : 'Select this menu'}
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Individual food order link */}
          {step === 'list' && onOpenFoodOrder && (
            <div className="border-t border-border pt-3">
              <Button variant="outline" className="w-full gap-2" onClick={onOpenFoodOrder}>
                <ShoppingBag className="h-4 w-4" />
                {isVi ? '👉 Đặt món riêng' : '👉 Order individual dishes'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Preview menu modal */}
      <Dialog open={!!previewPkg} onOpenChange={(o) => !o && setPreviewPkg(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {previewPkg?.name} <span className="text-primary text-base">· {previewPkg && formatPrice(previewPkg.price_per_person)}/{isVi ? 'suất' : 'serving'}</span>
            </DialogTitle>
          </DialogHeader>
          {previewPkg && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{isVi ? previewPkg.description_vi : previewPkg.description_en}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {getMenusByPackage(previewPkg.id).map((menu) => {
                  const dishes = getDishesByMenu(menu.id);
                  return (
                    <div key={menu.id} className="border border-border rounded-lg p-3">
                      <h4 className="font-bold text-sm mb-2">{isVi ? menu.name_vi : menu.name_en}</h4>
                      <ol className="space-y-1 text-xs text-muted-foreground">
                        {dishes.map((d, i) => (
                          <li key={d.id}>{i + 1}. {isVi ? d.name_vi : d.name_en}</li>
                        ))}
                      </ol>
                    </div>
                  );
                })}
              </div>
              <Button
                variant="gold"
                className="w-full"
                onClick={() => { handleSelectPackage(previewPkg); setPreviewPkg(null); }}
              >
                {isVi ? 'Chọn combo này' : 'Pick this combo'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComboSelector;
