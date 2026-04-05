import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UtensilsCrossed, ArrowLeft, Check, ChevronRight, AlertTriangle, Minus, Plus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useComboPackages, ComboPackage, ComboMenu } from '@/hooks/useComboPackages';
import { useLanguage } from '@/contexts/LanguageContext';
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
  selection: ComboSelection | null;
  onSelect: (selection: ComboSelection | null) => void;
  guestCount: number;
}

const ComboSelector = ({ required, selection, onSelect, guestCount }: ComboSelectorProps) => {
  const { packages, loading, getMenusByPackage, getDishesByMenu } = useComboPackages();
  const { language, formatPrice } = useLanguage();
  const isVi = language === 'vi';

  const [step, setStep] = useState<'list' | 'menus'>('list');
  const [selectedPkg, setSelectedPkg] = useState<ComboPackage | null>(null);
  const [quantity, setQuantity] = useState(selection?.quantity || 1);

  const handleSelectPackage = (pkg: ComboPackage) => {
    setSelectedPkg(pkg);
    setStep('menus');
  };

  const handleSelectMenu = (menu: ComboMenu) => {
    if (!selectedPkg) return;
    const menuDishes = getDishesByMenu(menu.id);
    onSelect({
      packageId: selectedPkg.id,
      packageName: selectedPkg.name,
      pricePerPerson: selectedPkg.price_per_person,
      menuId: menu.id,
      menuName: isVi ? menu.name_vi : menu.name_en,
      menuNumber: menu.menu_number,
      dishes: menuDishes.map(d => isVi ? d.name_vi : d.name_en),
      quantity,
    });
    setStep('list');
  };

  const handleBack = () => {
    setStep('list');
    setSelectedPkg(null);
  };

  const handleClear = () => {
    onSelect(null);
    setStep('list');
    setSelectedPkg(null);
  };

  const updateQty = (delta: number) => {
    const newQty = Math.max(1, (selection?.quantity || quantity) + delta);
    if (selection) {
      onSelect({ ...selection, quantity: newQty });
    }
    setQuantity(newQty);
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
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl font-semibold">Combo ăn uống</h2>
        {required && (
          <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Bắt buộc
          </span>
        )}
      </div>

      {required && !selection && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3 text-sm text-purple-700 dark:text-purple-300">
          ⚠️ {isVi ? 'Ngày bạn chọn yêu cầu chọn combo ăn uống để hoàn tất đặt phòng.' : 'Selected dates require a dining combo.'}
        </div>
      )}

      {/* Info note */}
      <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground flex gap-2">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <span>
          {isVi
            ? 'Mỗi mức giá gồm nhiều thực đơn khác nhau. Quý khách chọn 1 thực đơn khi đặt phòng. Thực đơn có thể thay đổi linh hoạt theo ngày/mùa.'
            : 'Each price tier includes multiple menus. Please select 1 menu when booking. Menus may vary by season.'}
        </span>
      </div>

      {/* Selected combo summary */}
      {selection && step === 'list' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/5 border-2 border-primary rounded-xl p-4 space-y-3"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-display font-bold text-foreground text-lg">
                ✅ {selection.packageName} – {selection.menuName}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {selection.dishes.join(' • ')}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground shrink-0">
              ✕
            </Button>
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">{isVi ? 'Số suất:' : 'Qty:'}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(-1)}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="font-bold text-lg w-8 text-center">{selection.quantity}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(1)}>
              <Plus className="h-3 w-3" />
            </Button>
            <span className="ml-auto text-primary font-bold">
              = {formatPrice(selection.pricePerPerson * selection.quantity)}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setStep('list'); }} className="w-full">
            {isVi ? 'Đổi combo khác' : 'Change combo'}
          </Button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* STEP 1: Choose combo package */}
        {step === 'list' && !selection && (
          <motion.div
            key="packages"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {packages.map((pkg) => (
              <motion.div
                key={pkg.id}
                whileHover={{ y: -2 }}
                className="rounded-xl border border-border overflow-hidden cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group"
                onClick={() => handleSelectPackage(pkg)}
              >
                {pkg.image_url && (
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={pkg.image_url}
                      alt={pkg.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-bold text-sm shadow-lg">
                      {formatPrice(pkg.price_per_person)}/suất
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-display text-lg font-bold text-foreground">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isVi ? pkg.description_vi : pkg.description_en}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">
                      {pkg.menu_count} {isVi ? 'thực đơn' : 'menus'} – {isVi ? 'chọn 1' : 'pick 1'}
                    </span>
                    <span className="text-primary text-sm font-medium flex items-center gap-1">
                      {isVi ? 'Xem thực đơn' : 'View menus'} <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </motion.div>
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
                <p className="text-sm text-primary font-medium">{formatPrice(selectedPkg.price_per_person)}/suất</p>
              </div>
            </div>

            {/* Quantity selector before choosing menu */}
            <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
              <span className="text-sm font-medium">{isVi ? 'Số suất:' : 'Quantity:'}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus className="h-3 w-3" />
              </Button>
              <span className="font-bold text-lg w-8 text-center">{quantity}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(quantity + 1)}>
                <Plus className="h-3 w-3" />
              </Button>
              <span className="ml-auto text-sm text-muted-foreground">
                = {formatPrice(selectedPkg.price_per_person * quantity)}
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
                      <h4 className="font-display font-bold text-foreground">
                        {isVi ? menu.name_vi : menu.name_en}
                      </h4>
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
    </div>
  );
};

export default ComboSelector;
