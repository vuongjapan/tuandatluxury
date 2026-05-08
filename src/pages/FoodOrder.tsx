import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useMenuItems } from '@/hooks/useMenuItems';
import { Search, X, ShoppingBag, Plus, Minus, Trash2, UtensilsCrossed, Sparkles, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import FoodCheckout from '@/components/FoodCheckout';
import PriceDisplay from '@/components/PriceDisplay';
import BookingInfoHeader, { useBookingContext } from '@/components/BookingInfoHeader';

const PRICE_FILTERS = [
  { key: '<100k', label_vi: 'Dưới 100k', label_en: 'Under 100k' },
  { key: '100k-500k', label_vi: '100 – 500k', label_en: '100 – 500k' },
  { key: '500k-1m', label_vi: '500k – 1tr', label_en: '500k – 1M' },
  { key: '>1m', label_vi: 'Trên 1tr', label_en: 'Over 1M' },
];

const CATEGORY_LABELS: Record<string, { vi: string; en: string }> = {
  breakfast: { vi: 'Ăn sáng', en: 'Breakfast' },
  main: { vi: 'Cơm', en: 'Rice' },
  seafood: { vi: 'Hải sản', en: 'Seafood' },
  shellfish: { vi: 'Hàu · Sò · Ngao', en: 'Shellfish' },
  hotpot: { vi: 'Lẩu', en: 'Hotpot' },
  fish: { vi: 'Cá', en: 'Fish' },
  chicken: { vi: 'Gà', en: 'Chicken' },
  meat: { vi: 'Thịt', en: 'Meat' },
  soup: { vi: 'Canh', en: 'Soup' },
  vegetable: { vi: 'Rau · Đậu phụ', en: 'Vegetables' },
  snack: { vi: 'Ăn vặt', en: 'Snacks' },
  other: { vi: 'Món khác', en: 'Other' },
  drinks: { vi: 'Đồ uống', en: 'Drinks' },
  combo: { vi: 'Combo', en: 'Combo' },
};

const FoodOrder = () => {
  const { language, formatPrice, pick } = useLanguage();
  const { addItem, items: cartItems, totalItems, totalAmount, updateQuantity } = useCart();
  const { toast } = useToast();
  const {
    items, loading, search, setSearch, category, setCategory,
    priceRange, setPriceRange, categories, popularItems,
    hasMore, loadMore, clearFilters, totalCount,
  } = useMenuItems();
  const { ctx, setCtx } = useBookingContext();
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const isVi = language === 'vi';
  const getName = (item: { name_vi: string; name_en: string }) => isVi ? item.name_vi : item.name_en;
  const hasFilters = !!search || !!category || !!priceRange;

  const handleAddToCart = (item: typeof items[0]) => {
    const variants = item.price_variants || [];
    if (variants.length > 0) {
      const variantId = selectedVariants[item.id] || variants[0].id;
      const variant = variants.find(v => v.id === variantId) || variants[0];
      const lineId = `${item.id}__${variant.id}`;
      addItem({
        id: lineId,
        name_vi: item.name_vi,
        name_en: item.name_en,
        price_vnd: variant.price_vnd,
        image_url: item.image_url,
        variant_id: variant.id,
        variant_label_vi: variant.label_vi,
        variant_label_en: variant.label_en,
      });
      toast({
        title: pick('Đã thêm vào giỏ', 'Added to cart'),
        description: `${getName(item)} · ${isVi ? variant.label_vi : variant.label_en}`,
      });
      return;
    }
    addItem({
      id: item.id,
      name_vi: item.name_vi,
      name_en: item.name_en,
      price_vnd: item.price_vnd,
      image_url: item.image_url,
    });
    toast({
      title: pick('Đã thêm vào giỏ', 'Added to cart'),
      description: getName(item),
    });
  };

  const getCartQty = (id: string) => {
    // For items with variants, sum all variant lines
    return cartItems
      .filter(i => i.id === id || i.id.startsWith(`${id}__`))
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  if (showCheckout) {
    return <FoodCheckout onBack={() => setShowCheckout(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero — minimalist Japanese */}
      <section className="pt-24 pb-6 bg-gradient-to-b from-secondary/40 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto mb-6"
          >
            <p className="text-[10px] font-semibold tracking-[0.32em] text-primary uppercase mb-2">
              {pick('Phục vụ tận phòng', 'In-room dining')}
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              {pick('Đặt món riêng', 'Order Your Dishes')}
            </h1>
            <div className="w-12 h-px bg-primary/60 mx-auto mt-3" />
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              {pick(
                'Chọn món, xác nhận nhanh — chúng tôi mang đến tận phòng quý khách.',
                'Pick your dishes — we will deliver to your suite.'
              )}
            </p>
          </motion.div>

          {/* Booking info header */}
          <div className="max-w-4xl mx-auto">
            <BookingInfoHeader value={ctx} onChange={setCtx} />
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="sticky top-16 z-40 bg-card/95 backdrop-blur-md border-y border-border/60">
        <div className="container mx-auto px-4 py-3 space-y-2">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={pick('Tìm món ăn...', 'Search dishes...')}
              className="pl-10 pr-10 h-10 rounded-full border-border/60 bg-background"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 max-w-5xl mx-auto">
            <button
              onClick={() => setCategory(null)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all border ${
                !category
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground'
              }`}
            >
              {pick('Tất cả', 'All')}
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(category === cat ? null : cat)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all border ${
                  category === cat
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground'
                }`}
              >
                {CATEGORY_LABELS[cat]?.[language] || cat}
              </button>
            ))}

            <div className="w-px bg-border shrink-0 self-stretch mx-1" />

            {PRICE_FILTERS.map(pf => (
              <button
                key={pf.key}
                onClick={() => setPriceRange(priceRange === pf.key ? null : pf.key)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all border ${
                  priceRange === pf.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-muted-foreground border-border hover:border-primary/40'
                }`}
              >
                {isVi ? pf.label_vi : pf.label_en}
              </button>
            ))}

            {hasFilters && (
              <button onClick={clearFilters} className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium text-destructive hover:bg-destructive/10 transition-all">
                <X className="h-3 w-3 inline mr-1" />
                {pick('Xóa lọc', 'Clear')}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Menu Items */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-20 text-muted-foreground text-sm tracking-wider">
              {pick('Đang tải thực đơn...', 'Loading menu...')}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <UtensilsCrossed className="h-10 w-10 mx-auto mb-3 opacity-30" strokeWidth={1.2} />
              <p className="text-sm">{pick('Không tìm thấy món ăn', 'No dishes found')}</p>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between mb-6 max-w-6xl mx-auto">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
                    {pick('Thực đơn hôm nay', "Today's menu")}
                  </p>
                  <p className="font-display text-xl font-semibold text-foreground mt-1">
                    {totalCount} {pick('món', 'dishes')}
                  </p>
                </div>
                <div className="hidden sm:block w-16 h-px bg-border" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 max-w-6xl mx-auto">
                {items.map(item => {
                  const qty = getCartQty(item.id);
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-card rounded-2xl border border-border/60 overflow-hidden hover:border-primary/40 hover:shadow-md transition-all group"
                    >
                      <div className="aspect-[4/3] bg-secondary overflow-hidden relative">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={getName(item)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UtensilsCrossed className="h-8 w-8 text-muted-foreground/30" strokeWidth={1.2} />
                          </div>
                        )}
                        {item.is_popular && (
                          <div className="absolute top-2 left-2 bg-card/90 backdrop-blur-sm border border-primary/30 text-primary text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1">
                            <Flame className="h-2.5 w-2.5" /> {pick('Hot', 'Hot')}
                          </div>
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        <h4 className="font-display text-sm text-foreground leading-tight line-clamp-2 min-h-[2.5rem]">
                          {getName(item)}
                        </h4>

                        {item.price_variants && item.price_variants.length > 0 ? (
                          <>
                            <div className="space-y-1">
                              {item.price_variants.map(v => {
                                const sel = (selectedVariants[item.id] || item.price_variants![0].id) === v.id;
                                return (
                                  <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => setSelectedVariants(prev => ({ ...prev, [item.id]: v.id }))}
                                    className={`w-full text-left text-[11px] px-2 py-1 rounded border transition-all flex items-center justify-between gap-1 ${
                                      sel ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-primary/40'
                                    }`}
                                  >
                                    <span className="flex items-center gap-1.5 min-w-0">
                                      <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${sel ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                      <span className="truncate">{isVi ? v.label_vi : v.label_en}</span>
                                    </span>
                                    <span className="font-semibold text-primary shrink-0">{formatPrice(v.price_vnd)}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs gap-1 border-foreground/20 hover:bg-foreground hover:text-background hover:border-foreground transition-colors"
                              onClick={() => handleAddToCart(item)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              {pick('Thêm', 'Add')}
                              {(() => {
                                const vid = selectedVariants[item.id] || item.price_variants![0].id;
                                const v = item.price_variants!.find(x => x.id === vid) || item.price_variants![0];
                                return ` ${formatPrice(v.price_vnd)}`;
                              })()}
                            </Button>
                            {qty > 0 && (
                              <p className="text-[10px] text-center text-muted-foreground">
                                {pick(`Đang có ${qty} trong giỏ`, `${qty} in cart`)}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <PriceDisplay
                              price={item.price_vnd}
                              priceType={(item as any).price_type}
                              showPrice={(item as any).show_price}
                              variants={item.price_variants as any}
                              className="text-sm font-bold text-primary inline-block"
                            />
                            {qty === 0 ? (
                              <Button size="sm" variant="outline" className="w-full text-xs gap-1 border-foreground/20 hover:bg-foreground hover:text-background hover:border-foreground transition-colors" onClick={() => handleAddToCart(item)}>
                                <Plus className="h-3.5 w-3.5" />
                                {pick('Thêm vào giỏ', 'Add')}
                              </Button>
                            ) : (
                              <div className="flex items-center justify-between bg-secondary rounded-full p-1">
                                <button onClick={() => updateQuantity(item.id, qty - 1)} className="w-7 h-7 rounded-full bg-card hover:bg-background flex items-center justify-center transition-colors">
                                  {qty === 1 ? <Trash2 className="h-3.5 w-3.5 text-destructive" /> : <Minus className="h-3.5 w-3.5" />}
                                </button>
                                <span className="text-sm font-semibold min-w-[1.5rem] text-center">{qty}</span>
                                <button onClick={() => updateQuantity(item.id, qty + 1)} className="w-7 h-7 rounded-full bg-card hover:bg-background flex items-center justify-center transition-colors">
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="text-center mt-10">
                  <Button variant="outline" onClick={loadMore} className="rounded-full px-8 tracking-wide">
                    {pick('Xem thêm', 'Load more')}
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
              className="w-full md:w-auto shadow-2xl gap-2 py-6 text-base rounded-full px-6"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="tracking-wide">{pick('Giỏ', 'Cart')} · {totalItems}</span>
              <span className="ml-1 font-bold">{formatPrice(totalAmount)}</span>
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
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-card z-50 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-border/60">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
                    {pick('Đơn của bạn', 'Your order')}
                  </p>
                  <h2 className="font-display text-lg font-bold mt-0.5">
                    {pick('Giỏ hàng', 'Cart')} · {totalItems}
                  </h2>
                </div>
                <button onClick={() => setShowCart(false)} className="p-1 rounded hover:bg-secondary">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cartItems.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" strokeWidth={1.2} />
                    <p className="text-sm">{pick('Giỏ hàng còn trống', 'Cart is empty')}</p>
                  </div>
                ) : (
                  cartItems.map(item => (
                    <div key={item.id} className="flex gap-3 p-3 bg-secondary/50 rounded-xl border border-border/40">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <UtensilsCrossed className="h-5 w-5 text-muted-foreground/30" strokeWidth={1.2} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">{getName(item)}</p>
                        {item.variant_label_vi && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {isVi ? item.variant_label_vi : (item.variant_label_en || item.variant_label_vi)}
                          </p>
                        )}
                        <PriceDisplay price={(item as any).price_vnd} priceType={(item as any).price_type} showPrice={(item as any).show_price} className="text-sm text-primary font-bold inline-block" />
                        <div className="flex items-center gap-1 mt-1.5">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 rounded-full bg-card hover:bg-background flex items-center justify-center border border-border">
                            {item.quantity === 1 ? <Trash2 className="h-3 w-3 text-destructive" /> : <Minus className="h-3 w-3" />}
                          </button>
                          <span className="text-sm font-semibold w-7 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 rounded-full bg-card hover:bg-background flex items-center justify-center border border-border">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-foreground self-center text-right">
                        {(item as any).price_type === 'negotiable' || (item as any).price_vnd === 0
                          ? <span className="text-[11px] text-orange-600">{pick('Tính tại NH', 'At venue')}</span>
                          : formatPrice((item as any).price_vnd * item.quantity)}
                      </div>
                    </div>
                  ))
                )}

                {cartItems.length > 0 && popularItems.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-border/60">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary flex items-center gap-1.5 mb-3">
                      <Sparkles className="h-3 w-3" /> {pick('Gợi ý thêm', 'You might also like')}
                    </p>
                    <div className="space-y-1.5">
                      {popularItems.filter(p => !cartItems.some(c => c.id === p.id)).slice(0, 5).map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/60 transition-colors">
                          {item.image_url ? (
                            <img src={item.image_url} alt="" className="w-10 h-10 rounded-md object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                              <UtensilsCrossed className="h-4 w-4 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{getName(item)}</p>
                            <PriceDisplay price={item.price_vnd} priceType={(item as any).price_type} showPrice={(item as any).show_price} variants={(item as any).price_variants} className="text-xs text-primary font-bold inline-block" />
                          </div>
                          <Button size="sm" variant="outline" className="h-7 text-xs shrink-0 rounded-full" onClick={() => handleAddToCart(item)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="p-5 border-t border-border/60 space-y-3 bg-secondary/30">
                  <div className="flex justify-between items-end">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{pick('Tổng cộng', 'Total')}</span>
                    <span className="font-display text-2xl font-bold text-primary">{formatPrice(totalAmount)}</span>
                  </div>
                  <Button
                    variant="gold"
                    className="w-full py-6 text-base tracking-wide rounded-full"
                    onClick={() => { setShowCart(false); setShowCheckout(true); }}
                  >
                    {pick('Tiến hành đặt món', 'Proceed to Order')}
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
