import { motion } from 'framer-motion';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import RoomCard from '@/components/RoomCard';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import { rooms } from '@/data/rooms';
import { useLanguage } from '@/contexts/LanguageContext';

const Index = () => {
  const { t } = useLanguage();

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
            <p className="text-muted-foreground leading-relaxed text-lg">
              {t('footer.desc')}
            </p>
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

      {/* Offers Section */}
      <section id="offers" className="py-20 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold text-foreground mb-3">{t('nav.offers')}</h2>
            <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full mb-8" />
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {t('platforms.direct')}
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default Index;
