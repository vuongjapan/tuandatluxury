import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UtensilsCrossed, ArrowLeft, Check, ChevronRight, AlertTriangle, Minus, Plus, Info, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
      <div className="flex items-center gap-2 flex-wrap">
        <UtensilsCrossed className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl font-semibold">Combo ăn uống</h2>
        {perPersonMode && (
          <span className="bg-chart-2/15 text-chart-2 text-xs font-bold px-2 py-0.5 rounded-full">
            Chế độ 1 người = 1 thực đơn
          </span>
        )}
        {required && (
          <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Bắt buộc
          </span>
        )}
      </div>

      {perPersonMode && (
        <div className="bg-chart-2/5 border border-chart-2/30 rounded-lg p-3 text-sm text-foreground">
          Mỗi khách sẽ có 1 thực đơn riêng · Hóa đơn tính theo số người ({guestCount} khách).
        </div>
      )}

      {required && selections.length === 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3 text-sm text-purple-700 dark:text-purple-300">
          ⚠️ {isVi ? 'Ngày bạn chọn yêu cầu chọn combo ăn uống để hoàn tất đặt phòng.' : 'Selected dates require a dining combo.'}
        </div>
      )}

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
            {isVi ? `Đã chọn ${totalComboServings}/${guestCount} suất (theo số người lớn)` : `Selected ${totalComboServings}/${guestCount} servings`}
          </span>
        </span>
        {totalComboServings === guestCount && (
          <span className="text-chart-2 font-bold text-xs">✅ Đủ</span>
        )}
        {totalComboServings > guestCount && (
          <span className="text-destructive font-bold text-xs">⚠️ Dư {totalComboServings - guestCount} suất</span>
        )}
      </div>

      {/* Info note */}
      <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground flex gap-2">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <span>
          {isVi
            ? 'Quý khách có thể chọn nhiều loại combo khác nhau. Tổng số suất phải bằng số người lớn. Mỗi mức giá gồm nhiều thực đơn – chọn 1 thực đơn khi đặt phòng.'
            : 'You can select different combo types. Total servings must equal the number of adults.'}
        </span>
      </div>

      {/* Selected combos list */}
      {selections.length > 0 && step === 'list' && (
        <div className="space-y-3">
          {selections.map((sel, idx) => (
            <motion.div
              key={`${sel.packageId}-${sel.menuId}-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/5 border-2 border-primary/50 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-foreground">
                    ✅ {sel.packageName} – {sel.menuName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {sel.dishes.join(' • ')}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeCombo(idx)} className="text-muted-foreground shrink-0">
                  ✕
                </Button>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">{isVi ? 'Số suất:' : 'Qty:'}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(idx, -1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="font-bold text-lg w-8 text-center">{sel.quantity}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(idx, 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
                <span className="ml-auto text-primary font-bold">
                  = {formatPrice(sel.pricePerPerson * sel.quantity)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Notes requirement for multiple combo types */}
      {hasMultipleTypes && step === 'list' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-3 space-y-2">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            📝 Ghi chú yêu cầu ăn uống {!comboNotes.trim() && <span className="text-destructive">(bắt buộc)</span>}
          </p>
          <Textarea
            value={comboNotes}
            onChange={e => onComboNotesChange(e.target.value)}
            placeholder="Mô tả lý do chọn nhiều loại combo..."
            rows={2}
            className="text-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            {NOTES_SUGGESTIONS.map(s => (
              <Button
                key={s}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => onComboNotesChange(comboNotes ? `${comboNotes}, ${s.toLowerCase()}` : s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* STEP 1: Choose combo package */}
        {step === 'list' && (remainingServings > 0 || selections.length === 0) && (
          <motion.div
            key="packages"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {selections.length > 0 && remainingServings > 0 && (
              <p className="text-sm font-medium text-primary mb-3">
                ➕ Chọn thêm combo cho {remainingServings} suất còn lại:
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {packages.map((pkg) => (
                <motion.div
                  key={pkg.id}
                  whileHover={{ y: -2 }}
                  className="rounded-xl border border-border overflow-hidden cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group"
                  onClick={() => handleSelectPackage(pkg)}
                >
                  {pkg.image_url && (
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img src={pkg.image_url} alt={pkg.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-bold text-sm shadow-lg">
                        {formatPrice(pkg.price_per_person)}/suất
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-display text-lg font-bold text-foreground">{pkg.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{isVi ? pkg.description_vi : pkg.description_en}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">{pkg.menu_count} {isVi ? 'thực đơn' : 'menus'}</span>
                      <span className="text-primary text-sm font-medium flex items-center gap-1">
                        {isVi ? 'Xem thực đơn' : 'View menus'} <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
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
                <p className="text-sm text-primary font-medium">{formatPrice(selectedPkg.price_per_person)}/suất</p>
              </div>
            </div>

            {/* Quantity selector */}
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
            👉 Đặt món riêng (xem menu)
          </Button>
        </div>
      )}
    </div>
  );
};

export default ComboSelector;
