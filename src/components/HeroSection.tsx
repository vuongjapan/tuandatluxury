import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import heroImageFallback from '@/assets/hero-hotel.jpg';

const HeroSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  const heroImage = settings.hero_image_url || heroImageFallback;

  return (
    <section id="overview" className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="Tuấn Đạt Luxury Hotel" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-hero-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-display text-5xl md:text-7xl font-bold text-primary-foreground mb-4 drop-shadow-lg">
            {t('hero.title')}
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto font-light">
            {t('hero.subtitle')}
          </p>
          <Button variant="hero" size="lg" onClick={() => navigate('/booking')}>
            {t('hero.book_now')}
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
