import { useEffect, useRef, useState } from 'react';
import { Fish, Utensils, Users, Wine, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';

interface SlideImage {
  url: string;
  title?: string;
}

const FALLBACK_SLIDES: SlideImage[] = [
  { url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80', title: 'Hải sản tươi' },
  { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80', title: 'Không gian nhà hàng' },
  { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80', title: 'Bữa tiệc nhóm' },
  { url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=1200&q=80', title: 'Rooftop Bar' },
  { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80', title: 'Món đặc sản' },
];

const RestaurantSection = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isVi = t('nav.rooms') === 'Hạng phòng';
  const { settings } = useSiteSettings();
  const [slides, setSlides] = useState<SlideImage[]>(FALLBACK_SLIDES);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Fetch restaurant images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data } = await supabase
          .from('gallery_images')
          .select('image_url, title_vi, title_en')
          .eq('is_active', true)
          .eq('category', 'restaurant')
          .order('sort_order', { ascending: true })
          .limit(6);
        if (data && data.length >= 3) {
          setSlides(
            data.map((d: any) => ({
              url: d.image_url,
              title: isVi ? d.title_vi || d.title_en : d.title_en || d.title_vi,
            }))
          );
        }
      } catch (e) {
        // keep fallback
      }
    };
    void fetchImages();
  }, [isVi]);

  // Auto-play slideshow
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length);
    }, 3500);
    return () => clearInterval(id);
  }, [paused, slides.length]);

  // Slide-in on scroll (once)
  useEffect(() => {
    if (!sectionRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const features = [
    { icon: Fish, vi: 'Hải sản tươi sống — đánh bắt hàng ngày', en: 'Fresh seafood — caught daily' },
    { icon: Utensils, vi: '120+ món từ 89.000đ/người', en: '120+ dishes from 89,000đ/person' },
    { icon: Users, vi: 'Thực đơn theo nhóm 1–20+ người', en: 'Group menus for 1–20+ people' },
    { icon: Wine, vi: 'Rooftop Bar tầng 6 — view biển', en: 'Rooftop Bar 6F — sea view' },
  ];

  const videoUrl = settings.feature_video_url || '';
  const thumbCaptions = isVi
    ? ['Hải sản tươi', 'Không gian nhà hàng', 'Bữa tiệc nhóm', 'Rooftop Bar']
    : ['Fresh seafood', 'Restaurant space', 'Group dining', 'Rooftop Bar'];

  return (
    <section ref={sectionRef} id="restaurant" className="py-20 sm:py-28 bg-secondary">
      <style>{`
        @keyframes rs-slide-left { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes rs-slide-right { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        .rs-anim-left { animation: rs-slide-left 0.6s ease-out both; }
        .rs-anim-right { animation: rs-slide-right 0.6s ease-out 0.1s both; }
      `}</style>

      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-8 lg:gap-12 items-center">
          {/* LEFT - Slideshow */}
          <div
            className={visible ? 'rs-anim-left' : 'opacity-0'}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div
              className="relative overflow-hidden rounded-xl shadow-luxury"
              style={{ height: 'clamp(260px, 45vw, 420px)' }}
            >
              {slides.map((s, i) => (
                <img
                  key={i}
                  src={s.url}
                  alt={s.title || ''}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[600ms] ease-in-out"
                  style={{ opacity: i === current ? 1 : 0 }}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                />
              ))}

              {/* Play button if video available */}
              {videoUrl && (
                <button
                  onClick={() => setVideoOpen(true)}
                  className="absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  style={{ background: '#C9A84C', color: '#FFFFFF' }}
                  aria-label="Play video"
                >
                  <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                </button>
              )}
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Slide ${i + 1}`}
                  className="transition-all duration-300"
                  style={{
                    width: i === current ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: i === current ? '#C9A84C' : '#D4D4D4',
                  }}
                />
              ))}
            </div>
          </div>

          {/* RIGHT - Content */}
          <div className={visible ? 'rs-anim-right' : 'opacity-0'}>
            <p className="font-display text-[11px] sm:text-xs font-medium mb-3" style={{ color: '#C9A84C', letterSpacing: '3px' }}>
              {isVi ? 'ẨM THỰC' : 'DINING'}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-4 tracking-tight" style={{ color: '#1B3A5C' }}>
              {isVi ? 'Hương Vị Biển Sầm Sơn' : 'Flavors of Sầm Sơn Sea'}
            </h2>
            <div className="mb-5" style={{ width: 50, height: 2, background: '#C9A84C' }} />
            <p className="mb-6 text-foreground/75" style={{ fontSize: 15, lineHeight: 1.8 }}>
              {isVi
                ? 'Nhà hàng Tuấn Đạt phục vụ hải sản tươi đánh bắt mỗi ngày tại Sầm Sơn. 120+ món từ hải sản, thịt, rau, lẩu — phù hợp từ 1 đến 20+ người.'
                : 'Tuấn Đạt Restaurant serves fresh seafood caught daily in Sầm Sơn. 120+ dishes from seafood, meat, vegetables, hotpot — suitable for 1 to 20+ guests.'}
            </p>

            <div className="space-y-3 mb-7">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(201,168,76,0.12)' }}>
                      <Icon className="h-4 w-4" style={{ color: '#C9A84C' }} />
                    </div>
                    <p className="text-sm text-foreground/85 pt-1.5">{isVi ? f.vi : f.en}</p>
                  </div>
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
          </div>
        </div>

        {/* Horizontal scroll thumbnails */}
        <div className="mt-12 max-w-6xl mx-auto">
          <div
            className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {slides.slice(0, 4).map((s, i) => (
              <div key={i} className="shrink-0 snap-start text-center">
                <div
                  className="overflow-hidden rounded-lg cursor-pointer"
                  style={{ width: 160, height: 110 }}
                  onClick={() => setCurrent(i)}
                >
                  <img
                    src={s.url}
                    alt={s.title || thumbCaptions[i]}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                </div>
                <p className="mt-2 text-xs font-medium" style={{ color: '#1B3A5C' }}>
                  {s.title || thumbCaptions[i]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video lightbox */}
      {videoOpen && videoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setVideoOpen(false)}
        >
          <button
            onClick={() => setVideoOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            aria-label="Close"
          >
            <X className="h-7 w-7" />
          </button>
          <div className="w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full rounded-lg"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default RestaurantSection;
