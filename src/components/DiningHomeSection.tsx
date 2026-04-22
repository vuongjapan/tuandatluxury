import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ArrowRight, Play } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

interface CuisineMedia {
  id: string;
  type: string;
  title: string | null;
  caption: string | null;
  media_url: string;
  is_active: boolean;
  sort_order: number;
}

const DiningHomeSection = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isVi = language === 'vi';

  // Fetch real cuisine media (images, moments, short videos)
  const { data: cuisineMedia = [] } = useQuery({
    queryKey: ['cuisine-media-home'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cuisine_media')
        .select('*')
        .eq('is_active', true)
        .in('type', ['image', 'moment', 'short_video'])
        .order('sort_order')
        .limit(8);
      return (data || []) as CuisineMedia[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Also fetch a hero video if available
  const { data: heroVideo } = useQuery({
    queryKey: ['cuisine-hero-home'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cuisine_media')
        .select('*')
        .eq('is_active', true)
        .eq('type', 'hero_video')
        .order('sort_order')
        .limit(1);
      return data?.[0] as CuisineMedia | undefined;
    },
    staleTime: 5 * 60 * 1000,
  });

  const images = cuisineMedia.filter(m => m.type === 'image' || m.type === 'moment');
  const videos = cuisineMedia.filter(m => m.type === 'short_video');

  return (
    <section id="dining" className="py-20 sm:py-28 bg-secondary luxury-section">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-primary font-display text-xs sm:text-sm tracking-[0.35em] uppercase mb-3">
            {t('dining.label')}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3">
            {t('dining.title')}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm mb-5">
            {t('dining.fresh')}
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-primary/70" />
            <div className="w-2 h-2 rounded-full bg-primary/70" />
            <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-primary/70" />
          </div>
        </motion.div>

        {/* Hero video preview */}
        {heroVideo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto mb-10 rounded-2xl overflow-hidden relative group cursor-pointer"
            onClick={() => navigate('/cuisine')}
          >
            {heroVideo.media_url.includes('youtube') || heroVideo.media_url.includes('youtu.be') ? (
              <div className="aspect-video bg-foreground">
                <iframe
                  src={`${heroVideo.media_url.replace('watch?v=', 'embed/')}?autoplay=0&mute=1&controls=0`}
                  className="w-full h-full"
                  allow="encrypted-media"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="aspect-video bg-foreground">
                <video
                  src={heroVideo.media_url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  onMouseEnter={e => (e.target as HTMLVideoElement).play().catch(() => {})}
                  onMouseLeave={e => { const v = e.target as HTMLVideoElement; v.pause(); }}
                />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="h-7 w-7 text-primary-foreground ml-1" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-white text-sm font-medium">
                {isVi ? 'Xem trải nghiệm ẩm thực →' : 'Watch culinary experience →'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Real images grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto mb-10">
            {images.slice(0, 8).map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                viewport={{ once: true }}
                onClick={() => navigate('/cuisine')}
                className="cursor-pointer group rounded-2xl overflow-hidden shadow-card hover:shadow-luxury hover:-translate-y-1 transition-all duration-500 border border-border bg-card"
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={item.media_url}
                    alt={item.title || item.caption || 'Ẩm thực'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                {item.caption && (
                  <div className="p-2 sm:p-3">
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{item.caption}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Short video reels preview */}
        {videos.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2 max-w-5xl mx-auto mb-10 scrollbar-hide">
            {videos.slice(0, 4).map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate('/cuisine')}
                className="w-32 sm:w-40 shrink-0 aspect-[9/16] rounded-xl overflow-hidden bg-foreground relative group cursor-pointer"
              >
                <video
                  src={v.media_url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  onMouseEnter={e => (e.target as HTMLVideoElement).play().catch(() => {})}
                  onMouseLeave={e => { const vid = e.target as HTMLVideoElement; vid.pause(); vid.currentTime = 0; }}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all flex items-center justify-center">
                  <Play className="h-6 w-6 text-white/80 group-hover:opacity-0 transition-opacity" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Fallback: if no cuisine media, show placeholder */}
        {images.length === 0 && !heroVideo && videos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm mb-10">
            {isVi ? 'Hình ảnh ẩm thực đang được cập nhật...' : 'Cuisine content coming soon...'}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button variant="gold" size="lg" onClick={() => navigate('/cuisine')} className="gap-2 group/btn">
            <UtensilsCrossed className="h-4 w-4" />
            {isVi ? 'Khám phá ẩm thực' : 'Explore Cuisine'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default DiningHomeSection;
