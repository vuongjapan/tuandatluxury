import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import RoomCard from '@/components/RoomCard';
import PhotoGallery from '@/components/PhotoGallery';
import PromotionsSection from '@/components/PromotionsSection';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import { useRooms } from '@/hooks/useRooms';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { t } = useLanguage();
  const { rooms } = useRooms();
  const navigate = useNavigate();

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { emoji: '🏖️', title: 'Bể bơi & Biển', desc: 'Bể bơi vô cực và bãi biển riêng' },
              { emoji: '🍽️', title: 'Nhà hàng', desc: 'Ẩm thực Việt Nam và quốc tế' },
              { emoji: '💆', title: 'Spa & Wellness', desc: 'Dịch vụ spa cao cấp thư giãn' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-card rounded-xl p-8 text-center shadow-card hover:shadow-card-hover transition-all duration-300 border border-border"
              >
                <span className="text-4xl mb-4 block">{s.emoji}</span>
                <h3 className="font-display text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
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
