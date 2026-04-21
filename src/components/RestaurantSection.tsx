import { Fish, Utensils, Users, Wine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FadeIn from '@/components/FadeIn';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const RestaurantSection = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isVi = t('nav.rooms') === 'Hạng phòng';
  const { settings } = useSiteSettings();
  const heroImg = settings.feature_restaurant_url || settings.about_image_url || '';

  const features = [
    {
      icon: Fish,
      vi: 'Hải sản tươi sống — đánh bắt mỗi ngày tại Sầm Sơn',
      en: 'Fresh seafood — caught daily in Sầm Sơn',
    },
    {
      icon: Utensils,
      vi: '120+ món ăn từ 89.000đ — Hải sản · Thịt · Chay',
      en: '120+ dishes from 89,000đ — Seafood · Meat · Vegan',
    },
    {
      icon: Users,
      vi: 'Thực đơn theo nhóm 1–20+ người',
      en: 'Group menus for 1–20+ people',
    },
    {
      icon: Wine,
      vi: 'Rooftop Bar tầng thượng — view hồ bơi & biển',
      en: 'Rooftop Bar — pool & sea view',
    },
  ];

  return (
    <section id="restaurant" className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Image - left */}
          <FadeIn direction="left">
            <div className="relative">
              {heroImg ? (
                <img
                  src={heroImg}
                  alt="Tuấn Đạt Restaurant"
                  className="w-full aspect-[4/3] object-cover rounded-2xl shadow-luxury"
                  loading="lazy"
                  width={800}
                  height={600}
                  style={{ filter: 'contrast(1.05) saturate(1.08)' }}
                />
              ) : (
                <div className="w-full aspect-[4/3] bg-muted rounded-2xl flex items-center justify-center">
                  <Utensils className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
              <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground rounded-xl px-5 py-3 shadow-luxury">
                <p className="font-display text-2xl font-bold leading-none">120+</p>
                <p className="text-[10px] uppercase tracking-wider mt-1">{isVi ? 'Món ăn' : 'Dishes'}</p>
              </div>
            </div>
          </FadeIn>

          {/* Content - right */}
          <FadeIn direction="right">
            <p className="text-primary font-display text-[11px] sm:text-xs tracking-[0.35em] uppercase mb-3 font-medium">
              {isVi ? 'Nhà hàng & Ẩm thực' : 'Restaurant & Dining'}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground mb-4 tracking-tight leading-tight">
              {isVi ? 'NHÀ HÀNG TUẤN ĐẠT' : 'TUẤN ĐẠT RESTAURANT'}
              <br />
              <span className="text-primary text-xl sm:text-2xl md:text-3xl">
                {isVi ? 'Hương vị biển Sầm Sơn' : 'Flavors of Sầm Sơn'}
              </span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8 leading-relaxed">
              {isVi
                ? 'Hải sản tươi đánh bắt mỗi ngày · Phục vụ tại bàn 07:00–21:30 · Rooftop Bar view biển'
                : 'Fresh seafood daily · Table service 07:00–21:30 · Rooftop Bar with sea view'}
            </p>

            <div className="space-y-4 mb-8">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <FadeIn key={i} delay={i * 80}>
                    <div className="flex items-start gap-4 group">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                      </div>
                      <p className="text-sm sm:text-base text-foreground/80 pt-2">{isVi ? f.vi : f.en}</p>
                    </div>
                  </FadeIn>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="gold" size="lg" onClick={() => navigate('/cuisine')} className="gap-2 tracking-wider">
                <Utensils className="h-4 w-4" />
                {isVi ? 'Xem thực đơn' : 'View Menu'}
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/food-order')} className="gap-2 tracking-wider">
                {isVi ? 'Đặt bàn ngay' : 'Book a Table'}
              </Button>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default RestaurantSection;
