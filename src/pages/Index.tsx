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
  const { categories: diningCategories } = useDining();
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
      <section id="dining" className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-4xl font-bold text-foreground mb-3">{t('nav.dining')}</h2>
            <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full" />
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto mb-10">
            {diningCategories.filter(c => c.is_active).map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                viewport={{ once: true }}
                onClick={() => navigate('/dining')}
                className="cursor-pointer group bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 border border-border"
              >
                {cat.image_url && (
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={cat.image_url}
                      alt={cat.name_vi}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-3 text-center">
                  <h3 className="font-display text-sm font-semibold text-foreground line-clamp-2">
                    {isVi ? cat.name_vi : (cat.name_en || cat.name_vi)}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Button variant="gold" size="lg" onClick={() => navigate('/dining')}>
              <UtensilsCrossed className="h-4 w-4 mr-2" />
              {isVi ? 'Xem thực đơn' : 'View Menu'}
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
