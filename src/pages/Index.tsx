import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Sparkles } from 'lucide-react';
import { useDining } from '@/hooks/useDining';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import RoomCard from '@/components/RoomCard';
import PhotoGallery from '@/components/PhotoGallery';
import PromotionsSection from '@/components/PromotionsSection';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import { useRooms } from '@/hooks/useRooms';
import { useServices } from '@/hooks/useServices';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const { t } = useLanguage();
  const { rooms } = useRooms();
  const { amenities } = useServices();
  const navigate = useNavigate();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />

      {/* Rooms Section */}
      <section id="rooms" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-4xl font-bold text-foreground mb-3">{t('nav.rooms')}</h2>
            <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full" />
          </motion.div>

          <div className="space-y-6">
            {rooms.map((room, i) => (
              <RoomCard key={room.id} room={room} index={i} />
            ))}
          </div>
        </div>
      </section>

      <PhotoGallery />

      {/* About Section */}
      <section id="about" className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="font-display text-4xl font-bold text-foreground mb-6">{t('nav.about')}</h2>
            <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full mb-8" />
            <p className="text-muted-foreground leading-relaxed text-lg">{t('footer.desc')}</p>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-4xl font-bold text-foreground mb-3">{t('nav.services')}</h2>
            <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full" />
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {amenities.slice(0, 8).map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                viewport={{ once: true }}
                className="bg-card rounded-xl p-6 text-center shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 border border-border"
              >
                <span className="text-4xl mb-3 block">{s.icon}</span>
                <h3 className="font-display text-sm md:text-base font-semibold mb-1">{isVi ? s.name_vi : s.name_en}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{isVi ? s.description_vi : s.description_en}</p>
                {s.is_free && (
                  <Badge variant="outline" className="mt-2 text-xs border-primary/30 text-primary">
                    {isVi ? 'Miễn phí' : 'Free'}
                  </Badge>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <Button variant="gold" size="lg" onClick={() => navigate('/services')}>
              <Sparkles className="h-4 w-4 mr-2" />
              {isVi ? 'Xem tất cả dịch vụ & đặt dịch vụ' : 'View all services & book'}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Dining Section */}
      <section id="dining" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="font-display text-4xl font-bold text-foreground mb-3">{t('nav.dining')}</h2>
            <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full mb-6" />
            <p className="text-muted-foreground text-lg mb-8">
              {t('nav.dining') === 'Ẩm thực'
                ? 'Hải sản tươi sống, buffet sáng đa dạng, combo nhóm và dịch vụ phòng tiện lợi'
                : 'Fresh seafood, diverse breakfast buffet, group combos and convenient room service'}
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {['🦐 Hải sản tươi sống', '👨‍👩‍👧‍👦 Món gia đình', '🎉 COMBO đoàn', '🍳 Buffet sáng', '🛎️ Room Service'].map((item, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className="px-4 py-2 bg-card rounded-full border border-border text-sm font-medium shadow-card"
                >
                  {item}
                </motion.span>
              ))}
            </div>
            <Button variant="gold" size="lg" onClick={() => navigate('/dining')}>
              <UtensilsCrossed className="h-4 w-4 mr-2" />
              {t('nav.dining') === 'Ẩm thực' ? 'Xem thực đơn' : 'View Menu'}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Promotions Section */}
      <PromotionsSection />

      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default Index;
