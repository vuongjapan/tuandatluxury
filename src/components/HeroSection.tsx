import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import heroImageFallback from '@/assets/hero-hotel.jpg';
import BookingSearch from './BookingSearch';

const HeroSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  const heroImage = settings.hero_image_url || heroImageFallback;

  return (
    <section id="overview" className="relative min-h-[70vh] sm:min-h-[92vh] flex flex-col justify-center overflow-hidden pt-24 sm:pt-28">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Tuấn Đạt Luxury Hotel"
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,20%,15%,0.3)] via-[hsl(220,20%,15%,0.5)] to-[hsl(220,20%,15%,0.7)]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 text-center flex-1 flex flex-col items-center justify-center">
        <p className="text-primary font-display text-sm sm:text-base tracking-[0.3em] uppercase mb-3 sm:mb-4">
          {isVi ? 'Chào mừng đến với' : 'Welcome to'}
        </p>
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-primary-foreground mb-3 sm:mb-4 drop-shadow-lg leading-tight">
          {t('hero.title')}
        </h1>
        <div className="w-24 h-[2px] bg-primary mx-auto mb-4 sm:mb-5" />
        <p className="text-base sm:text-lg md:text-xl text-primary-foreground/85 mb-6 sm:mb-8 max-w-2xl mx-auto font-light tracking-wide">
          {t('hero.subtitle')}
        </p>
        <Button variant="hero" size="lg" onClick={() => navigate('/booking')} className="text-base px-8 py-3">
          {t('hero.book_now')}
        </Button>
      </div>

      {/* Booking Search Bar - overlaid at bottom like Imperial */}
      <div className="relative z-10 w-full px-4 -mb-8 sm:-mb-10 pb-0">
        <div className="container mx-auto">
          <BookingSearch />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
