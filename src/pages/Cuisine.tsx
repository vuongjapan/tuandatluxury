import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UtensilsCrossed, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDining } from '@/hooks/useDining';

const Cuisine = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isVi = t('nav.rooms') === 'Hạng phòng';
  const { categories } = useDining();

  const sections = [
    {
      titleVi: '🦐 Hải sản tươi sống',
      titleEn: '🦐 Fresh Seafood',
      descVi: 'Tận hưởng hải sản tươi ngon nhất từ biển Sầm Sơn, được chế biến bởi đầu bếp giàu kinh nghiệm. Từ tôm hùm, cua biển đến mực, ghẹ — tất cả đều được đánh bắt trong ngày.',
      descEn: 'Enjoy the freshest seafood from Sầm Sơn beach, prepared by experienced chefs. From lobster, crab to squid — all caught daily.',
    },
    {
      titleVi: '🍳 Buffet sáng miễn phí',
      titleEn: '🍳 Complimentary Breakfast Buffet',
      descVi: 'Bắt đầu ngày mới với buffet sáng phong phú tại tầng 1 nhà hàng. Đa dạng món Việt và quốc tế, phục vụ từ 06:00 đến 08:30.',
      descEn: 'Start your day with a rich breakfast buffet at the 1st floor restaurant. Diverse Vietnamese and international dishes, served from 06:00 to 08:30.',
    },
    {
      titleVi: '🍱 Set Menu & Cơm đoàn',
      titleEn: '🍱 Set Menu & Group Dining',
      descVi: 'Thực đơn đa dạng cho nhóm và gia đình với set menu hải sản đặc biệt. Phục vụ từ 10:00 đến 21:00, giá chưa bao gồm thuế VAT.',
      descEn: 'Diverse menus for groups and families with special seafood set menus. Served from 10:00 to 21:00, prices exclude VAT.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Banner */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-20 bg-foreground text-background overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <p className="text-primary font-display text-xs tracking-[0.4em] uppercase mb-3">
            {isVi ? 'Trải nghiệm ẩm thực' : 'Culinary Experience'}
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold mb-4">
            {isVi ? 'Ẩm thực đẳng cấp' : 'Premium Cuisine'}
          </h1>
          <p className="text-background/70 max-w-2xl mx-auto text-sm sm:text-base">
            {isVi
              ? 'Trải nghiệm ẩm thực đẳng cấp tại Tuấn Đạt Luxury Hotel, nơi hội tụ tinh hoa ẩm thực biển Sầm Sơn.'
              : 'Experience premium cuisine at Tuấn Đạt Luxury Hotel, where the culinary essence of Sầm Sơn converges.'}
          </p>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="space-y-16">
            {sections.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="text-center max-w-3xl mx-auto"
              >
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  {isVi ? s.titleVi : s.titleEn}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {isVi ? s.descVi : s.descEn}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Dining Categories from DB */}
          {categories.length > 0 && (
            <div className="mt-16">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
                {isVi ? 'Thực đơn của chúng tôi' : 'Our Menu'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    {cat.image_url && (
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={cat.image_url}
                          alt={isVi ? cat.name_vi : cat.name_en}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                        {isVi ? cat.name_vi : cat.name_en}
                      </h3>
                      {cat.serving_hours && (
                        <p className="text-xs text-muted-foreground mb-2">🕐 {cat.serving_hours}</p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {isVi ? cat.description_vi : cat.description_en}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="text-center mt-16">
            <Button variant="gold" size="lg" onClick={() => navigate('/food-order')} className="gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              {isVi ? 'Đặt món ngay' : 'Order Food Now'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Cuisine;
