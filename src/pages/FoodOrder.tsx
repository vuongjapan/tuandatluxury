import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useMenuItems } from '@/hooks/useMenuItems';
import { Search, X, ShoppingCart, Plus, Minus, Trash2, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import FoodCheckout from '@/components/FoodCheckout';
import PriceDisplay from '@/components/PriceDisplay';

const PRICE_FILTERS = [
  { key: '<100k', label_vi: '<100k', label_en: '<100k' },
  { key: '100k-500k', label_vi: '100k–500k', label_en: '100k–500k' },
  { key: '500k-1m', label_vi: '500k–1tr', label_en: '500k–1M' },
  { key: '>1m', label_vi: '>1tr', label_en: '>1M' },
];

const CATEGORY_LABELS: Record<string, { vi: string; en: string }> = {
  breakfast: { vi: 'Ăn sáng', en: 'Breakfast' },
  main: { vi: 'Cơm', en: 'Rice dishes' },
  seafood: { vi: 'Hải sản', en: 'Seafood' },
  shellfish: { vi: 'Hàu - Sò - Ngao', en: 'Oysters & Clams' },
  hotpot: { vi: 'Lẩu', en: 'Hotpot' },
  fish: { vi: 'Cá', en: 'Fish' },
  chicken: { vi: 'Gà', en: 'Chicken' },
  meat: { vi: 'Thịt', en: 'Meat' },
  soup: { vi: 'Canh', en: 'Soup' },
  vegetable: { vi: 'Rau & Đậu phụ', en: 'Vegetables & Tofu' },
  snack: { vi: 'Ăn vặt', en: 'Snacks' },
  other: { vi: 'Món khác', en: 'Other' },
  drinks: { vi: 'Đồ uống', en: 'Drinks' },
  combo: { vi: 'Combo', en: 'Combo' },
};

const FoodOrder = () => {
  const { language, formatPrice } = useLanguage();
  const { addItem, items: cartItems, totalItems, totalAmount, updateQuantity, removeItem } = useCart();
  const { toast } = useToast();
  const {
    items, loading, search, setSearch, category, setCategory,
    priceRange, setPriceRange, categories, popularItems,
    hasMore, loadMore, clearFilters, totalCount,
  } = useMenuItems();
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const isVi = language === 'vi';
  const getName = (item: { name_vi: string; name_en: string }) => isVi ? item.name_vi : item.name_en;
  const hasFilters = !!search || !!category || !!priceRange;

  const handleAddToCart = (item: typeof items[0]) => {
    addItem({
      id: item.id,
      name_vi: item.name_vi,
      name_en: item.name_en,
      price_vnd: item.price_vnd,
      image_url: item.image_url,
    });
    toast({
      title: isVi ? 'Đã thêm vào giỏ' : 'Added to cart',
      description: getName(item),
    });
  };

  const getCartQty = (id: string) => cartItems.find(i => i.id === id)?.quantity || 0;

  if (showCheckout) {
    return <FoodCheckout onBack={() => setShowCheckout(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-24 pb-8 bg-secondary">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              {isVi ? 'Đặt đồ ăn trực tuyến' : 'Order Food Online'}
            </h1>
            <div className="w-16 h-1 bg-gold-gradient mx-auto rounded-full mb-4" />
            <p className="text-muted-foreground">
              {isVi ? 'Chọn món, thanh toán nhanh – phục vụ tận phòng' : 'Pick your dishes, pay online – room delivery'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="sticky top-16 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isVi ? 'Tìm món ăn...' : 'Search dishes...'}
              className="pl-10 pr-10"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Category + Price filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {/* Categories */}
            <button
              onClick={() => setCategory(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!category ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
              {isVi ? 'Tất cả' : 'All'}
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(category === cat ? null : cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${category === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
              >
                {CATEGORY_LABELS[cat]?.[language] || cat}
              </button>
            ))}

            <div className="w-px bg-border shrink-0" />

            {/* Price filters */}
            {PRICE_FILTERS.map(pf => (
              <button
                key={pf.key}
                onClick={() => setPriceRange(priceRange === pf.key ? null : pf.key)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${priceRange === pf.key ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
              >
                {isVi ? pf.label_vi : pf.label_en}
              </button>
            ))}

            {hasFilters && (
              <button onClick={clearFilters} className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium text-destructive hover:bg-destructive/10 transition-all">
                <X className="h-3 w-3 inline mr-1" />
                {isVi ? 'Xóa lọc' : 'Clear'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Menu Items */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-20 text-muted-foreground">
              {isVi ? 'Đang tải...' : 'Loading...'}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{isVi ? 'Không tìm thấy món ăn' : 'No dishes found'}</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount} {isVi ? 'món' : 'items'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {items.map(item => {
                  const qty = getCartQty(item.id);
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-card rounded-xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all group"
                    >
                      <div className="aspect-square bg-secondary overflow-hidden relative">
                        {item.image_url ? (
                          <img src={item.image_url} alt={getName(item)} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UtensilsCrossed className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                        {item.is_popular && (
                          <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5">
                            HOT
                          </Badge>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-sm text-foreground leading-tight mb-1 line-clamp-2 min-h-[2.5rem]">
                          {getName(item)}
                        </h4>
                        <PriceDisplay
                          price={item.price_vnd}
                          priceType={(item as any).price_type}
                          showPrice={(item as any).show_price}
                          variants={item.price_variants as any}
                          className="text-sm font-bold text-primary mb-2 inline-block"
                        />

                        {qty === 0 ? (
                          <Button size="sm" variant="gold" className="w-full text-xs gap-1" onClick={() => handleAddToCart(item)}>
                            <Plus className="h-3.5 w-3.5" />
                            {isVi ? 'Thêm' : 'Add'}
                          </Button>
                        ) : (
                          <div className="flex items-center justify-between bg-secondary rounded-lg p-1">
                            <button onClick={() => updateQuantity(item.id, qty - 1)} className="p-1 rounded hover:bg-background transition-colors">
                              {qty === 1 ? <Trash2 className="h-3.5 w-3.5 text-destructive" /> : <Minus className="h-3.5 w-3.5" />}
                            </button>
                            <span className="text-sm font-semibold min-w-[1.5rem] text-center">{qty}</span>
                            <button onClick={() => updateQuantity(item.id, qty + 1)} className="p-1 rounded hover:bg-background transition-colors">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="text-center mt-8">
                  <Button variant="outline" onClick={loadMore}>
                    {isVi ? 'Xem thêm' : 'Load more'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {totalItems > 0 && !showCart && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-0 right-0 z-50 px-4 md:px-0 md:left-auto md:right-6 md:bottom-24 md:w-auto"
          >
            <Button
              onClick={() => setShowCart(true)}
              variant="gold"
              className="w-full md:w-auto shadow-lg gap-2 py-6 text-base"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>{isVi ? 'Giỏ hàng' : 'Cart'} ({totalItems})</span>
              <span className="ml-2 font-bold">{formatPrice(totalAmount)}</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/50 z-50"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-card z-50 shadow-xl flex flex-col"
            >
              {/* Cart Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-display text-lg font-bold">{isVi ? 'Giỏ hàng' : 'Cart'} ({totalItems})</h2>
                <button onClick={() => setShowCart(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>{isVi ? 'Giỏ hàng trống' : 'Cart is empty'}</p>
                  </div>
                ) : (
                  cartItems.map(item => (
                    <div key={item.id} className="flex gap-3 p-3 bg-secondary rounded-xl">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <UtensilsCrossed className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{getName(item)}</p>
                        <PriceDisplay price={(item as any).price_vnd} priceType={(item as any).price_type} showPrice={(item as any).show_price} className="text-sm text-primary font-bold inline-block" />
                        <div className="flex items-center gap-2 mt-1">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-0.5 rounded hover:bg-background">
                            {item.quantity === 1 ? <Trash2 className="h-3.5 w-3.5 text-destructive" /> : <Minus className="h-3.5 w-3.5" />}
                          </button>
                          <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-0.5 rounded hover:bg-background">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-foreground self-center">
                        {(item as any).price_type === 'negotiable' || (item as any).price_vnd === 0
                          ? <span className="text-[11px] text-orange-600">{isVi ? 'Tính tại NH' : 'At venue'}</span>
                          : formatPrice((item as any).price_vnd * item.quantity)}
                      </div>
                    </div>
                  ))
                )}

                {/* Upsell Section */}
                {cartItems.length > 0 && popularItems.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      {isVi ? '🔥 Gợi ý thêm món' : '🔥 You might also like'}
                    </h3>
                    <div className="space-y-2">
                      {popularItems.filter(p => !cartItems.some(c => c.id === p.id)).slice(0, 5).map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                          {item.image_url ? (
                            <img src={item.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              <UtensilsCrossed className="h-4 w-4 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{getName(item)}</p>
                            <PriceDisplay price={item.price_vnd} priceType={(item as any).price_type} showPrice={(item as any).show_price} variants={(item as any).price_variants} className="text-xs text-primary font-bold inline-block" />
                          </div>
                          <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => handleAddToCart(item)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cartItems.length > 0 && (
                <div className="p-4 border-t border-border space-y-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{isVi ? 'Tổng cộng' : 'Total'}</span>
                    <span className="text-primary">{formatPrice(totalAmount)}</span>
                  </div>
                  <Button
                    variant="gold"
                    className="w-full py-6 text-base"
                    onClick={() => { setShowCart(false); setShowCheckout(true); }}
                  >
                    {isVi ? 'Tiến hành đặt hàng' : 'Proceed to Order'}
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default FoodOrder;
