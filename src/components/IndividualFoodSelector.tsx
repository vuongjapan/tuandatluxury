import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Minus, Plus, Search, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMenuItems, type MenuItemPrice } from '@/hooks/useMenuItems';
import { useLanguage } from '@/contexts/LanguageContext';
import PriceDisplay from '@/components/PriceDisplay';
import MenuViewerModal from '@/components/MenuViewerModal';

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  priceLabel?: string; // e.g. "Nhỏ", "Vừa", "Lớn"
  priceVariantId?: string; // ID of selected price variant
}

interface Props {
  open: boolean;
  onClose: () => void;
  items: FoodItem[];
  onItemsChange: (items: FoodItem[]) => void;
  /** When true (mandatory holiday), shows progress bar in dialog footer too */
  isMandatory?: boolean;
  guestCount?: number;
  minPerPerson?: number;
  hasOtherValidSelection?: boolean;
}

const IndividualFoodSelector = ({ open, onClose, items, onItemsChange, isMandatory, guestCount = 0, minPerPerson = 300000, hasOtherValidSelection = false }: Props) => {
  const { allItems, loading } = useMenuItems();
  const { formatPrice, language } = useLanguage();
  const [search, setSearch] = useState('');
  // Track which price variant is selected per menu item (for items with multiple prices)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const activeItems = useMemo(() => allItems.filter(m => m.price_vnd > 0 || (m.price_variants && m.price_variants.length > 0)), [allItems]);

  const categories = useMemo(() => {
    const cats = new Set(activeItems.map(m => m.category));
    return Array.from(cats);
  }, [activeItems]);

  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    let list = activeItems;
    if (selectedCat) list = list.filter(m => m.category === selectedCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m => m.name_vi.toLowerCase().includes(q) || m.name_en.toLowerCase().includes(q));
    }
    return list;
  }, [activeItems, selectedCat, search]);

  // Generate a unique cart key: itemId or itemId__variantId
  const getCartKey = (menuItemId: string, variantId?: string) => {
    return variantId ? `${menuItemId}__${variantId}` : menuItemId;
  };

  const addItem = (menuItem: any, variant?: MenuItemPrice) => {
    const cartKey = getCartKey(menuItem.id, variant?.id);
    const price = variant ? variant.price_vnd : menuItem.price_vnd;
    const priceLabel = variant ? (language === 'vi' ? variant.label_vi : variant.label_en) : undefined;

    const existing = items.find(i => i.id === cartKey);
    if (existing) {
      onItemsChange(items.map(i => i.id === cartKey ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      onItemsChange([...items, {
        id: cartKey,
        name: menuItem.name_vi,
        price,
        quantity: 1,
        category: menuItem.category,
        priceLabel,
        priceVariantId: variant?.id,
      }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    const updated = items.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0);
    onItemsChange(updated);
  };

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const catLabels: Record<string, string> = {
    breakfast: '🍳 Ăn sáng',
    main: '🍚 Cơm',
    seafood: '🦐 Hải sản',
    hotpot: '🍲 Lẩu',
    drink: '🥤 Đồ uống',
    dessert: '🍰 Tráng miệng',
    bbq: '🥩 BBQ',
    combo: '🥘 Combo',
    shellfish: '🦪 Hàu - Sò',
    fish: '🐟 Cá',
    chicken: '🍗 Gà',
    meat: '🥩 Thịt',
    soup: '🍜 Canh',
    vegetable: '🥬 Rau',
    snack: '🍿 Ăn vặt',
    other: '📦 Khác',
    drinks: '🥤 Đồ uống',
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="bg-card w-full max-w-2xl max-h-[85vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold">Đặt món riêng</h2>
              {totalItems > 0 && (
                <Badge className="bg-primary text-primary-foreground">{totalItems} món</Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm món ăn..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
              <Button
                variant={selectedCat === null ? 'default' : 'outline'}
                size="sm"
                className="text-xs shrink-0"
                onClick={() => setSelectedCat(null)}
              >
                Tất cả
              </Button>
              {categories.map((cat: string) => (
                <Button
                  key={cat}
                  variant={selectedCat === cat ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs shrink-0"
                  onClick={() => setSelectedCat(cat)}
                >
                  {catLabels[cat] || cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {loading && <div className="text-center py-8 text-muted-foreground">Đang tải...</div>}
            {filteredItems.map(item => {
              const hasVariants = item.price_variants && item.price_variants.length > 0;
              const selectedVariantId = selectedVariants[item.id];
              const selectedVariant = hasVariants
                ? item.price_variants!.find(v => v.id === selectedVariantId)
                : undefined;

              // Find all cart entries for this menu item
              const cartEntries = items.filter(i => i.id.startsWith(item.id));
              const itemInCart = cartEntries.length > 0;

              return (
                <div key={item.id} className={`p-2.5 rounded-lg border transition-all ${itemInCart ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                  <div className="flex items-center gap-3">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.name_vi} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name_vi}</p>
                      {!hasVariants && (
                        <p className="text-xs text-primary font-bold">{formatPrice(item.price_vnd)}</p>
                      )}
                    </div>

                    {/* No variants: simple add/qty buttons */}
                    {!hasVariants && (() => {
                      const cartKey = getCartKey(item.id);
                      const inCart = items.find(i => i.id === cartKey);
                      return inCart ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(cartKey, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-bold w-6 text-center text-sm">{inCart.quantity}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(cartKey, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="shrink-0 text-xs" onClick={() => addItem(item)}>
                          <Plus className="h-3 w-3 mr-1" /> Thêm
                        </Button>
                      );
                    })()}

                    {/* Has variants: show dropdown + add */}
                    {hasVariants && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Select
                          value={selectedVariantId || ''}
                          onValueChange={v => setSelectedVariants(prev => ({ ...prev, [item.id]: v }))}
                        >
                          <SelectTrigger className="h-8 w-[120px] text-xs">
                            <SelectValue placeholder="Chọn giá" />
                          </SelectTrigger>
                          <SelectContent>
                            {item.price_variants!.map(v => (
                              <SelectItem key={v.id} value={v.id} className="text-xs">
                                {v.label_vi} – {formatPrice(v.price_vnd)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 text-xs"
                          disabled={!selectedVariant}
                          onClick={() => {
                            if (selectedVariant) addItem(item, selectedVariant);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Thêm
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Show cart entries for variants */}
                  {hasVariants && cartEntries.length > 0 && (
                    <div className="mt-2 space-y-1 pl-2 border-l-2 border-primary/30 ml-2">
                      {cartEntries.map(entry => (
                        <div key={entry.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {entry.priceLabel} – {formatPrice(entry.price)}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(entry.id, -1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-bold w-5 text-center">{entry.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(entry.id, 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer / cart summary */}
          <div className="p-4 border-t border-border bg-secondary/50 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{totalItems} món đã chọn</p>
                <p className="font-bold text-primary text-lg">{formatPrice(total)}</p>
              </div>
              <Button variant="gold" onClick={onClose}>
                Xong
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IndividualFoodSelector;
