import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const heroVideoDesktop = settings.hero_video_url || '';
  const heroVideoMobile = settings.hero_video_mobile_url || heroVideoDesktop;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(true);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Decide whether to load the video at all (slow connection / save data)
  useEffect(() => {
    const conn = (navigator as any).connection;
    if (conn) {
      const slow = conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g' || conn.effectiveType === '3g';
      if (slow || conn.saveData) {
        setShowVideo(false);
        return;
      }
    }
  }, []);

  // Pick the right source based on viewport, then attach + play
  useEffect(() => {
    if (!showVideo || !heroVideoDesktop) return;
    const el = videoRef.current;
    if (!el) return;

    const isMobile = window.innerWidth < 768;
    const src = isMobile && heroVideoMobile ? heroVideoMobile : heroVideoDesktop;
    if (el.src !== src) {
      el.src = src;
      el.load();
    }
    const playPromise = el.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  }, [showVideo, heroVideoDesktop, heroVideoMobile]);

  // Pause video when tab hidden
  useEffect(() => {
    const handler = () => {
      const el = videoRef.current;
      if (!el) return;
      if (document.hidden) {
        el.pause();
      } else {
        el.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  const hasVideo = !!heroVideoDesktop && showVideo;

  return (
    <section id="overview" className="relative min-h-[85vh] h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {hasVideo ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={heroImage}
              onLoadedData={() => setVideoLoaded(true)}
              className={`hero-video transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
            {!videoLoaded && (
              <img
                src={heroImage}
                alt="Tuấn Đạt Luxury Hotel"
                className="absolute inset-0 w-full h-full object-cover object-center"
                loading="eager"
                {...({ fetchpriority: 'high' } as any)}
                decoding="async"
                width={1920}
                height={1080}
              />
            )}
          </>
        ) : (
          <img
            src={heroImage}
            alt="Tuấn Đạt Luxury Hotel"
            className="w-full h-full object-cover object-center"
            loading="eager"
            {...({ fetchpriority: 'high' } as any)}
            decoding="async"
            width={1920}
            height={1080}
            style={{ filter: 'contrast(1.05) saturate(1.08)' }}
          />
        )}
        {/* Vinpearl-style overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,25%,10%,0.15)] via-[hsl(220,25%,10%,0.30)] to-[hsl(220,25%,10%,0.65)]" />
      </div>

      {/* Decorative gold lines */}
      <div className="absolute left-8 sm:left-16 top-1/4 bottom-1/4 w-[1px] bg-gradient-to-b from-transparent via-primary/40 to-transparent hidden lg:block" />
      <div className="absolute right-8 sm:right-16 top-1/4 bottom-1/4 w-[1px] bg-gradient-to-b from-transparent via-primary/40 to-transparent hidden lg:block" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pt-24">
        <p
          className={`text-primary font-display text-xs sm:text-sm tracking-[0.4em] uppercase mb-5 transition-all duration-1000 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '200ms' }}
        >
          {t('hero.welcome')}
        </p>

        <h1
          className={`font-display font-bold text-primary-foreground drop-shadow-2xl leading-tight mb-5 transition-all duration-1000 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ fontSize: 'clamp(2.2rem, 7vw, 5.5rem)', transitionDelay: '400ms', letterSpacing: '-0.02em' }}
        >
          {settings.hero_title || t('hero.title')}
        </h1>

        <div
          className={`w-32 h-[1px] bg-primary mx-auto mb-6 transition-all duration-1000 ease-out ${visible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`}
          style={{ transitionDelay: '700ms' }}
        />

        <p
          className={`text-primary-foreground/80 font-light tracking-widest text-sm sm:text-base md:text-lg max-w-xl mx-auto mb-10 transition-all duration-1000 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: '900ms' }}
        >
          {settings.hero_subtitle || t('hero.subtitle')}
        </p>

        <div
          className={`flex flex-col sm:flex-row items-center gap-3 transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '1100ms' }}
        >
          <Button
            variant="hero"
            size="lg"
            onClick={() => navigate('/booking')}
            className="text-sm px-10 py-5 tracking-widest uppercase font-semibold"
          >
            {t('hero.cta_book')}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-sm px-8 py-5 tracking-widest uppercase font-medium text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10 hover:border-primary-foreground/60 bg-transparent"
          >
            {t('hero.cta_explore')}
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div
        className={`relative z-10 w-full transition-all duration-800 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{ transitionDelay: '1400ms' }}
      >
        <div className="bg-foreground/80 backdrop-blur-md border-t border-primary/20">
          <div className="section-container">
            <div className="grid grid-cols-3 divide-x divide-primary/20">
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
      </div>

      {/* Scroll indicator */}
      <div className={`absolute bottom-[72px] sm:bottom-[76px] left-1/2 -translate-x-1/2 z-10 animate-bounce ${visible ? 'opacity-60' : 'opacity-0'}`}>
        <ChevronDown className="h-5 w-5 text-primary/80" />
      </div>
    </section>
  );
};

export default HeroSection;
