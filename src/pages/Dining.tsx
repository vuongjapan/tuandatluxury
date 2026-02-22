import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import { useDining } from '@/hooks/useDining';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, Users, UtensilsCrossed, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const Dining = () => {
  const { t, language, formatPrice } = useLanguage();
  const { categories, items, loading, getItemsByCategory } = useDining();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const getName = (item: { name_vi: string; name_en: string }) =>
    language === 'vi' ? item.name_vi : item.name_en;

  const getDesc = (item: { description_vi: string | null; description_en: string | null }) =>
    language === 'vi' ? item.description_vi : item.description_en;

  const handleOrder = (itemName: string) => {
    toast({
      title: language === 'vi' ? 'Đã thêm vào đơn' : 'Added to order',
      description: itemName,
    });
  };

  const selectedCategory = activeCategory
    ? categories.find(c => c.id === activeCategory)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-24 pb-12 bg-secondary">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t('nav.dining')}
            </h1>
            <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full mb-6" />
            <p className="text-muted-foreground text-lg">
              {language === 'vi'
                ? 'Khám phá ẩm thực đa dạng từ hải sản tươi sống, buffet sáng đến dịch vụ phòng tiện lợi'
                : 'Discover diverse cuisine from fresh seafood, breakfast buffet to convenient room service'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="sticky top-16 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-3 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !activeCategory
                  ? 'bg-primary text-primary-foreground shadow-gold'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {language === 'vi' ? 'Tất cả' : 'All'}
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground shadow-gold'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {getName(cat)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-20 text-muted-foreground">
              {language === 'vi' ? 'Đang tải...' : 'Loading...'}
            </div>
          ) : activeCategory === null ? (
            /* Overview - show all categories as cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat, i) => {
                const catItems = getItemsByCategory(cat.id);
                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 group cursor-pointer"
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <div className="aspect-[16/10] bg-secondary overflow-hidden">
                      {cat.image_url ? (
                        <img
                          src={cat.image_url}
                          alt={getName(cat)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UtensilsCrossed className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-display text-xl font-bold text-foreground mb-2">
                        {getName(cat)}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {getDesc(cat)}
                      </p>
                      <div className="flex items-center justify-between">
                        {cat.serving_hours && (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            {cat.serving_hours}
                          </span>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {catItems.length} {language === 'vi' ? 'món' : 'items'}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* Category detail - show items */
            <div>
              {selectedCategory && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <div className="flex items-start gap-6 mb-6">
                    {selectedCategory.image_url && (
                      <img
                        src={selectedCategory.image_url}
                        alt=""
                        className="w-32 h-24 rounded-xl object-cover hidden md:block border border-border"
                      />
                    )}
                    <div>
                      <h2 className="font-display text-3xl font-bold text-foreground mb-2">
                        {getName(selectedCategory)}
                      </h2>
                      <p className="text-muted-foreground">{getDesc(selectedCategory)}</p>
                      {selectedCategory.serving_hours && (
                        <span className="inline-flex items-center gap-1.5 mt-2 text-sm text-primary font-medium">
                          <Clock className="h-4 w-4" />
                          {language === 'vi' ? 'Giờ phục vụ' : 'Serving hours'}: {selectedCategory.serving_hours}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {getItemsByCategory(activeCategory).map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all"
                  >
                    <div className="aspect-[4/3] bg-secondary overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={getName(item)} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UtensilsCrossed className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-display text-lg font-semibold text-foreground leading-tight">
                          {getName(item)}
                        </h4>
                        {item.is_combo && (
                          <Badge className="shrink-0 bg-primary/10 text-primary border-primary/20 text-[10px]">
                            COMBO
                          </Badge>
                        )}
                      </div>
                      {getDesc(item) && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {getDesc(item)}
                        </p>
                      )}
                      {item.is_combo && item.combo_serves && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                          <Users className="h-3.5 w-3.5" />
                          {item.combo_serves} {language === 'vi' ? 'người' : 'people'}
                        </span>
                      )}
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(item.price_vnd)}
                        </span>
                        <Button
                          size="sm"
                          variant="gold"
                          className="text-xs gap-1.5"
                          onClick={() => handleOrder(getName(item))}
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          {language === 'vi' ? 'Đặt món' : 'Order'}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {getItemsByCategory(activeCategory).length === 0 && (
                  <div className="col-span-full text-center py-16 text-muted-foreground">
                    {language === 'vi' ? 'Chưa có món ăn nào trong mục này' : 'No items in this category yet'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default Dining;
