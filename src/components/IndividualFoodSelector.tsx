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
  priceLabel?: string;
  priceVariantId?: string;
  priceType?: 'fixed' | 'negotiable';
  /** Which meal slot this item belongs to. Defaults to 'dinner' for back-compat. */
  meal?: 'lunch' | 'dinner';
}

interface Props {
  open: boolean;
  onClose: () => void;
  items: FoodItem[];
  onItemsChange: (items: FoodItem[]) => void;
  isMandatory?: boolean;
  guestCount?: number;
  minPerPerson?: number;
  hasOtherValidSelection?: boolean;
  /** Which meal slot we are filling — tags items + cart-key so same dish can be added to both. */
  meal?: 'lunch' | 'dinner';
}

const IndividualFoodSelector = ({ open, onClose, items, onItemsChange, isMandatory, guestCount = 0, minPerPerson = 300000, hasOtherValidSelection = false }: Props) => {
  const { allItems, loading } = useMenuItems();
  const { formatPrice, language } = useLanguage();
  const isVi = language === 'vi';
  const [search, setSearch] = useState('');
  // Track which price variant is selected per menu item (for items with multiple prices)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [menuViewerOpen, setMenuViewerOpen] = useState(false);

  // Show negotiable items too — they just won't add to the total.
  const activeItems = useMemo(
    () => allItems.filter(m =>
      (m as any).price_type === 'negotiable'
      || m.price_vnd > 0
      || (m.price_variants && m.price_variants.length > 0)
    ),
    [allItems]
  );

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
    // Treat any zero-priced item OR explicit 'negotiable' flag as negotiable.
    const isNegotiable = (menuItem as any).price_type === 'negotiable'
      || (variant ? variant.price_vnd === 0 : menuItem.price_vnd === 0);
    const priceType: 'fixed' | 'negotiable' = isNegotiable ? 'negotiable' : 'fixed';
    const price = isNegotiable ? 0 : (variant ? variant.price_vnd : menuItem.price_vnd);
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
        priceType,
      }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    const updated = items.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0);
    onItemsChange(updated);
  };

  // Total only counts FIXED-price items. Negotiable items are paid at the restaurant.
  const total = items.reduce((s, i) => s + (i.priceType === 'negotiable' ? 0 : i.price * i.quantity), 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const negotiableCount = items.filter(i => i.priceType === 'negotiable').reduce((s, i) => s + i.quantity, 0);

  const catLabels: Record<string, string> = {
    breakfast: isVi ? 'Ăn sáng' : 'Breakfast',
    main: isVi ? 'Cơm' : 'Rice',
    seafood: isVi ? 'Hải sản' : 'Seafood',
    hotpot: isVi ? 'Lẩu' : 'Hotpot',
    drink: isVi ? 'Đồ uống' : 'Drinks',
    dessert: isVi ? 'Tráng miệng' : 'Dessert',
    bbq: 'BBQ',
    combo: 'Combo',
    shellfish: isVi ? 'Hàu · Sò' : 'Shellfish',
    fish: isVi ? 'Cá' : 'Fish',
    chicken: isVi ? 'Gà' : 'Chicken',
    meat: isVi ? 'Thịt' : 'Meat',
    soup: isVi ? 'Canh' : 'Soup',
    vegetable: isVi ? 'Rau' : 'Vegetables',
    snack: isVi ? 'Ăn vặt' : 'Snacks',
    other: isVi ? 'Khác' : 'Other',
    drinks: isVi ? 'Đồ uống' : 'Drinks',
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
          className="bg-card w-full max-w-2xl max-h-[88vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-border/40"
          onClick={e => e.stopPropagation()}
        >
          {/* Header — Japanese minimalist */}
          <div className="px-5 pt-5 pb-4 border-b border-border/60 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
                  {isVi ? 'Lựa chọn riêng' : 'À la carte'}
                </p>
                <h2 className="font-display text-xl font-bold text-foreground tracking-tight mt-1 flex items-center gap-2">
                  {isVi ? 'Đặt món riêng' : 'Order dishes'}
                  {totalItems > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
                      {totalItems}
                    </span>
                  )}
                </h2>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="text-xs gap-1.5 h-8" onClick={() => setMenuViewerOpen(true)}>
                  <BookOpen className="h-3.5 w-3.5" /> {isVi ? 'Thực đơn' : 'Menu'}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-5 pt-3 pb-3 border-b border-border/60 shrink-0 bg-secondary/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isVi ? 'Tìm món ăn...' : 'Search dishes...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 rounded-full border-border/60 bg-card text-sm"
              />
            </div>
            <div className="flex gap-1.5 mt-2.5 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedCat(null)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium tracking-wide border transition-all ${
                  selectedCat === null
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground'
                }`}
              >
                {isVi ? 'Tất cả' : 'All'}
              </button>
              {categories.map((cat: string) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium tracking-wide border transition-all ${
                    selectedCat === cat
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground'
                  }`}
                >
                  {catLabels[cat] || cat}
                </button>
              ))}
            </div>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {loading && <div className="text-center py-10 text-muted-foreground text-sm tracking-wider">{isVi ? 'Đang tải thực đơn...' : 'Loading...'}</div>}
            {!loading && filteredItems.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                {isVi ? 'Không tìm thấy món phù hợp' : 'No matching dishes'}
              </div>
            )}
            {filteredItems.map(item => {
              const hasVariants = item.price_variants && item.price_variants.length > 0;
              const selectedVariantId = selectedVariants[item.id];
              const selectedVariant = hasVariants
                ? item.price_variants!.find(v => v.id === selectedVariantId)
                : undefined;
              const itemPriceType = (
                (item as any).price_type === 'negotiable' || item.price_vnd === 0
              ) ? 'negotiable' : 'fixed' as 'fixed' | 'negotiable';

              const cartEntries = items.filter(i => i.id.startsWith(item.id));
              const itemInCart = cartEntries.length > 0;

              return (
                <div key={item.id} className={`p-3 rounded-xl border transition-all ${itemInCart ? 'border-primary/60 bg-primary/5' : 'border-border/60 hover:border-foreground/30'}`}>
                  <div className="flex items-center gap-3">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name_vi} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <ShoppingBag className="h-5 w-5 text-muted-foreground/30" strokeWidth={1.2} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm font-medium truncate text-foreground">{isVi ? item.name_vi : (item.name_en || item.name_vi)}</p>
                      {!hasVariants && (
                        <PriceDisplay price={item.price_vnd} priceType={itemPriceType} className="text-xs text-primary font-bold mt-0.5 inline-block" />
                      )}
                      {hasVariants && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 tracking-wide uppercase">
                          {isVi ? 'Chọn kích cỡ' : 'Select size'}
                        </p>
                      )}
                    </div>

                    {!hasVariants && (() => {
                      const cartKey = getCartKey(item.id);
                      const inCart = items.find(i => i.id === cartKey);
                      return inCart ? (
                        <div className="flex items-center gap-1 shrink-0 bg-secondary rounded-full p-0.5">
                          <button onClick={() => updateQty(cartKey, -1)} className="w-7 h-7 rounded-full bg-card hover:bg-background flex items-center justify-center border border-border/60">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-bold w-6 text-center text-sm">{inCart.quantity}</span>
                          <button onClick={() => updateQty(cartKey, 1)} className="w-7 h-7 rounded-full bg-card hover:bg-background flex items-center justify-center border border-border/60">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="shrink-0 text-xs rounded-full px-4 border-foreground/20 hover:bg-foreground hover:text-background hover:border-foreground" onClick={() => addItem(item)}>
                          <Plus className="h-3 w-3 mr-1" /> {isVi ? 'Thêm' : 'Add'}
                        </Button>
                      );
                    })()}

                    {hasVariants && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Select value={selectedVariantId || ''} onValueChange={v => setSelectedVariants(prev => ({ ...prev, [item.id]: v }))}>
                          <SelectTrigger className="h-8 w-[120px] text-xs rounded-full"><SelectValue placeholder={isVi ? 'Chọn giá' : 'Pick'} /></SelectTrigger>
                          <SelectContent>
                            {item.price_variants!.map(v => (
                              <SelectItem key={v.id} value={v.id} className="text-xs">
                                {v.label_vi} — {itemPriceType === 'negotiable' ? (isVi ? 'Thỏa thuận' : 'On request') : formatPrice(v.price_vnd)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" className="shrink-0 text-xs rounded-full border-foreground/20 hover:bg-foreground hover:text-background hover:border-foreground" disabled={!selectedVariant} onClick={() => { if (selectedVariant) addItem(item, selectedVariant); }}>
                          <Plus className="h-3 w-3 mr-1" /> {isVi ? 'Thêm' : 'Add'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {hasVariants && cartEntries.length > 0 && (
                    <div className="mt-2.5 space-y-1 pl-3 border-l border-primary/30 ml-2">
                      {cartEntries.map(entry => (
                        <div key={entry.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground inline-flex items-center gap-1.5">
                            <span className="font-medium text-foreground">{entry.priceLabel}</span>
                            <span>—</span>
                            <PriceDisplay price={entry.price} priceType={entry.priceType} compact />
                          </span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateQty(entry.id, -1)} className="w-6 h-6 rounded-full hover:bg-secondary flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                            <span className="font-bold w-5 text-center">{entry.quantity}</span>
                            <button onClick={() => updateQty(entry.id, 1)} className="w-6 h-6 rounded-full hover:bg-secondary flex items-center justify-center"><Plus className="h-3 w-3" /></button>
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
          <div className="px-5 py-4 border-t border-border/60 bg-secondary/40 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  {totalItems > 0
                    ? (isVi ? `${totalItems} món đã chọn` : `${totalItems} item(s) selected`)
                    : (isVi ? 'Chưa chọn món' : 'Nothing selected')}
                </p>
                <p className="font-display font-bold text-primary text-xl mt-0.5">{formatPrice(total)}</p>
              </div>
              <Button variant="gold" className="rounded-full px-6 tracking-wide" onClick={onClose}>
                {isVi ? 'Xong' : 'Done'}
              </Button>
            </div>
            {negotiableCount > 0 && (
              <p className="text-[11px] text-muted-foreground mt-2 italic">
                * {isVi ? `${negotiableCount} món giá thỏa thuận sẽ được tính tại nhà hàng` : `${negotiableCount} negotiable item(s) will be billed at the restaurant`}
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
      <MenuViewerModal open={menuViewerOpen} onClose={() => setMenuViewerOpen(false)} />
    </AnimatePresence>
  );
};

export default IndividualFoodSelector;
