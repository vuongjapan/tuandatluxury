import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import heroImageFallback from '@/assets/hero-hotel.jpg';

const HeroSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const isVi = t('nav.rooms') === 'Hạng phòng';
  const heroImage = settings.hero_image_url || heroImageFallback;
  const heroVideo = settings.hero_video_url || '';

  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => { setVisible(true); }, []);

  return (
    <section id="overview" className="relative h-screen min-h-[600px] flex flex-col overflow-hidden">
      {/* Background - Video or Image */}
      <div className="absolute inset-0">
        {heroVideo ? (
          <>
            <video
              ref={videoRef}
              src={heroVideo}
              autoPlay
              muted
              loop
              playsInline
              onLoadedData={() => setVideoLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{ transform: 'scale(1.05)' }}
            />
            {/* Fallback image while video loads */}
            {!videoLoaded && (
              <img
                src={heroImage}
                alt="Tuấn Đạt Luxury Hotel"
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
              />
            )}
          </>
        ) : (
          <img
            src={heroImage}
            alt="Tuấn Đạt Luxury Hotel"
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
          />
        )}
        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,25%,10%,0.55)] via-[hsl(220,25%,10%,0.35)] to-[hsl(220,25%,10%,0.80)]" />
        {/* Left vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220,25%,10%,0.4)] to-transparent" />
      </div>

      {/* Decorative gold lines */}
      <div className="absolute left-8 sm:left-16 top-1/4 bottom-1/4 w-[1px] bg-gradient-to-b from-transparent via-primary/60 to-transparent hidden lg:block" />
      <div className="absolute right-8 sm:right-16 top-1/4 bottom-1/4 w-[1px] bg-gradient-to-b from-transparent via-primary/60 to-transparent hidden lg:block" />

      {/* Main hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pt-24">
        <AnimatePresence>
          {visible && (
            <>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-primary font-display text-xs sm:text-sm tracking-[0.4em] uppercase mb-4 sm:mb-5"
              >
                {isVi ? '✦  Chào mừng đến với  ✦' : '✦  Welcome to  ✦'}
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.4 }}
                className="font-display font-bold text-primary-foreground drop-shadow-2xl leading-tight mb-4"
                style={{ fontSize: 'clamp(2.5rem, 8vw, 6rem)' }}
              >
                {settings.hero_title || t('hero.title')}
              </motion.h1>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="w-32 h-[1px] bg-primary mx-auto mb-5"
              />

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="text-primary-foreground/80 font-light tracking-widest text-sm sm:text-base md:text-lg max-w-xl mx-auto mb-8 sm:mb-10"
              >
                {settings.hero_subtitle || t('hero.subtitle')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.2 }}
                className="flex flex-col sm:flex-row items-center gap-3"
              >
                <Button
                  variant="hero"
                  size="lg"
                  onClick={() => navigate('/booking')}
                  className="text-sm px-10 py-5 tracking-widest uppercase font-semibold"
                >
                  {t('hero.book_now')}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm px-8 py-5 tracking-widest uppercase font-medium text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10 hover:border-primary-foreground/70 bg-transparent"
                >
                  {isVi ? 'Khám phá phòng' : 'Explore Rooms'}
                </Button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.4 }}
        className="relative z-10 w-full"
      >
        <div className="bg-foreground/80 backdrop-blur-md border-t border-primary/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-3 sm:grid-cols-3 divide-x divide-primary/30">
              {[
                { numVi: '19+', labelVi: 'Phòng sang trọng', numEn: '19+', labelEn: 'Luxury Rooms' },
                { numVi: '9.4', labelVi: 'Điểm Agoda / 10', numEn: '9.4', labelEn: 'Agoda Score / 10' },
                { numVi: '5★', labelVi: 'Khu FLC 5 sao', numEn: '5★', labelEn: 'FLC 5-Star Resort' },
              ].map((stat, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center py-3 sm:py-4 px-2 sm:px-6">
                  <span className="font-display text-lg sm:text-2xl font-bold text-primary">
                    {isVi ? stat.numVi : stat.numEn}
                  </span>
                  <span className="text-[10px] sm:text-xs text-background/70 tracking-wider uppercase text-center leading-tight mt-0.5">
                    {isVi ? stat.labelVi : stat.labelEn}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2, delay: 2, repeat: Infinity }}
        className="absolute bottom-[72px] sm:bottom-[76px] left-1/2 -translate-x-1/2 z-10"
      >
        <ChevronDown className="h-5 w-5 text-primary/80" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
