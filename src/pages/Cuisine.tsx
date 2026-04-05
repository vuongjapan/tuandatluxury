import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UtensilsCrossed, ArrowRight, Star, Clock, Phone } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDining } from '@/hooks/useDining';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Cuisine = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isVi = t('nav.rooms') === 'Hạng phòng';
  const { categories, items } = useDining();

  // Fetch combo packages for set menu display
  const { data: combos = [] } = useQuery({
    queryKey: ['combo-packages-cuisine'],
    queryFn: async () => {
      const { data } = await supabase
        .from('combo_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Group items by category
  const featuredItems = items.filter(i => i.image_url).slice(0, 12);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Banner */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20 bg-foreground text-background overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <p className="text-primary font-display text-xs tracking-[0.4em] uppercase mb-3">
            {isVi ? 'Nhà hàng Tuấn Đạt Luxury' : 'Tuấn Đạt Luxury Restaurant'}
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold mb-4">
            {isVi ? 'Ẩm thực đẳng cấp biển Sầm Sơn' : 'Premium Sầm Sơn Seafood Cuisine'}
          </h1>
          <p className="text-background/70 max-w-2xl mx-auto text-sm sm:text-base">
            {isVi
              ? 'Hải sản tươi sống đánh bắt trong ngày, chế biến bởi đầu bếp giàu kinh nghiệm. Từ bàn ăn gia đình đến tiệc đoàn — mọi bữa ăn đều là trải nghiệm.'
              : 'Fresh seafood caught daily, prepared by experienced chefs. From family dining to group feasts — every meal is an experience.'}
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="flex items-center gap-1.5 text-sm text-background/60">
              <Clock className="h-4 w-4 text-primary" />
              <span>10:00 – 21:00</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-background/30" />
            <div className="flex items-center gap-1.5 text-sm text-background/60">
              <Phone className="h-4 w-4 text-primary" />
              <span>098.360.5768</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Dishes - Blog/Marketing style */}
      {featuredItems.length > 0 && (
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <p className="text-primary font-display text-xs tracking-[0.3em] uppercase mb-2">
                {isVi ? 'Đặc sản nổi bật' : 'SIGNATURE DISHES'}
              </p>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-foreground mb-3">
                {isVi ? 'Món ngon từ bếp Tuấn Đạt' : 'From Our Kitchen'}
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm">
                {isVi
                  ? 'Mỗi món ăn là một câu chuyện — từ hải sản tươi sống đánh bắt trong ngày đến những công thức gia truyền độc đáo.'
                  : 'Each dish tells a story — from daily-caught fresh seafood to unique family recipes.'}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300 group"
                >
                  {item.image_url && (
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={isVi ? item.name_vi : item.name_en}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute bottom-3 right-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-bold text-sm shadow-lg">
                        {item.price_vnd.toLocaleString('vi-VN')}₫
                      </div>
                    </div>
                  )}
                  <div className="p-4 sm:p-5">
                    <h3 className="font-display text-base sm:text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                      {isVi ? item.name_vi : item.name_en}
                    </h3>
                    {(isVi ? item.description_vi : item.description_en) && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {isVi ? item.description_vi : item.description_en}
                      </p>
                    )}
                    {item.is_combo && item.combo_serves && (
                      <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                        {isVi ? `Phục vụ ${item.combo_serves} người` : `Serves ${item.combo_serves}`}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Button variant="gold" size="lg" onClick={() => navigate('/food-order')} className="gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                {isVi ? 'Xem thực đơn đầy đủ & Đặt món' : 'Full Menu & Order'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Menu Categories */}
      {categories.length > 0 && (
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <p className="text-primary font-display text-xs tracking-[0.3em] uppercase mb-2">MENU</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                {isVi ? 'Danh mục ẩm thực' : 'Our Menu Categories'}
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
                  onClick={() => navigate('/dining')}
                >
                  {cat.image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={cat.image_url}
                        alt={isVi ? cat.name_vi : cat.name_en}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {isVi ? cat.name_vi : cat.name_en}
                    </h3>
                    {cat.serving_hours && (
                      <p className="text-xs text-primary font-medium mb-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {cat.serving_hours}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {isVi ? cat.description_vi : cat.description_en}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Set Menu / Combo Packages */}
      {combos.length > 0 && (
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <p className="text-primary font-display text-xs tracking-[0.3em] uppercase mb-2">SET MENU</p>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-foreground mb-3">
                {isVi ? 'Thực đơn đoàn — Giá ưu đãi' : 'Group Set Menus — Great Value'}
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm">
                {isVi
                  ? 'Phù hợp cho gia đình, nhóm bạn bè và đoàn khách. Phục vụ 10:00 – 21:00.'
                  : 'Perfect for families, friend groups and tour groups. Served 10:00 – 21:00.'}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {combos.map((combo, i) => (
                <motion.div
                  key={combo.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-2xl border border-border p-5 sm:p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="text-primary font-display text-2xl sm:text-3xl font-bold mb-2">
                    {combo.price_per_person.toLocaleString('vi-VN')}₫
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{isVi ? '/suất' : '/person'}</p>
                  <h3 className="font-display text-base font-semibold text-foreground mb-3">{combo.name}</h3>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p>{combo.menu_count} {isVi ? 'thực đơn' : 'menus'} · {combo.dishes_per_menu} {isVi ? 'món/set' : 'dishes/set'}</p>
                    {(isVi ? combo.description_vi : combo.description_en) && (
                      <p className="text-xs line-clamp-2">{isVi ? combo.description_vi : combo.description_en}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Highlights */}
      <section className="py-16 sm:py-20 bg-secondary">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: <UtensilsCrossed className="h-8 w-8 text-primary mx-auto" />,
                titleVi: 'Hải sản tươi sống',
                titleEn: 'Fresh Seafood',
                descVi: 'Tôm, cua, ghẹ, mực, hàu — tất cả đều được đánh bắt trong ngày từ biển Sầm Sơn.',
                descEn: 'Shrimp, crab, squid, oysters — all caught daily from Sầm Sơn sea.',
              },
              {
                icon: <Clock className="h-8 w-8 text-primary mx-auto" />,
                titleVi: 'Buffet sáng miễn phí',
                titleEn: 'Free Breakfast Buffet',
                descVi: 'Buffet sáng đa dạng tại tầng 1. Món Việt và quốc tế, phục vụ 06:00 – 08:30.',
                descEn: 'Rich breakfast buffet at 1st floor. Vietnamese and international, served 06:00 – 08:30.',
              },
              {
                icon: <Star className="h-8 w-8 text-primary mx-auto" />,
                titleVi: 'Đầu bếp chuyên nghiệp',
                titleEn: 'Expert Chefs',
                descVi: 'Đội ngũ đầu bếp kinh nghiệm 10+ năm, chuyên hải sản & ẩm thực Việt.',
                descEn: '10+ years experienced chef team, specializing in seafood & Vietnamese cuisine.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="space-y-3"
              >
                {item.icon}
                <h3 className="font-display text-lg font-bold text-foreground">{isVi ? item.titleVi : item.titleEn}</h3>
                <p className="text-sm text-muted-foreground">{isVi ? item.descVi : item.descEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
              {isVi ? 'Sẵn sàng thưởng thức?' : 'Ready to Dine?'}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto text-sm">
              {isVi
                ? 'Đặt món trực tuyến hoặc liên hệ trực tiếp để đặt bàn cho đoàn.'
                : 'Order online or contact us directly to book a table for your group.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button variant="gold" size="lg" onClick={() => navigate('/food-order')} className="gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                {isVi ? 'Đặt món ngay' : 'Order Food Now'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <a href="tel:0983605768">
                <Button variant="outline" size="lg" className="gap-2">
                  <Phone className="h-4 w-4" /> 098.360.5768
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Cuisine;
