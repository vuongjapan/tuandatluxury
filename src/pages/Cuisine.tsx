import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UtensilsCrossed, ArrowRight, Star, Clock, Phone, Play, X, ChefHat, Waves } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CuisineMedia {
  id: string;
  type: string;
  title: string | null;
  caption: string | null;
  media_url: string;
  thumbnail_url: string | null;
  media_group: string | null;
  sort_order: number;
  is_active: boolean;
}

const Cuisine = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isVi = t('nav.rooms') === 'Hạng phòng';
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const { data: media = [] } = useQuery({
    queryKey: ['cuisine-media'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cuisine_media')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      return (data || []) as CuisineMedia[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const heroVideos = media.filter(m => m.type === 'hero_video');
  const shortVideos = media.filter(m => m.type === 'short_video');
  const images = media.filter(m => m.type === 'image');
  const moments = media.filter(m => m.type === 'moment');
  const menuPhotos = media.filter(m => m.type === 'menu_photo');

  const menuLe = menuPhotos.filter(m => m.media_group === 'menu_le');
  const menuDoan = menuPhotos.filter(m => m.media_group === 'menu_doan');
  const menuCombo = menuPhotos.filter(m => m.media_group === 'combo');
  const menuGeneral = menuPhotos.filter(m => !m.media_group || m.media_group === 'general');

  const ctaButton = (
    <Button
      variant="gold"
      size="lg"
      onClick={() => navigate('/food-order')}
      className="gap-2 group/btn"
    >
      <UtensilsCrossed className="h-5 w-5" />
      {isVi ? 'Đặt đồ ăn ngay' : 'Order Food Now'}
      <ArrowRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
    </Button>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ===== 1. HERO VIDEO ===== */}
      <section className="relative pt-20 min-h-[70vh] flex items-center justify-center bg-foreground text-background overflow-hidden">
        {heroVideos.length > 0 && (
          <div className="absolute inset-0">
            {heroVideos[0].media_url.includes('youtube') || heroVideos[0].media_url.includes('youtu.be') ? (
              <iframe
                src={`${heroVideos[0].media_url.replace('watch?v=', 'embed/')}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0`}
                className="w-full h-full object-cover"
                allow="autoplay; encrypted-media"
                style={{ position: 'absolute', top: '-60px', left: 0, width: '100%', height: 'calc(100% + 120px)' }}
              />
            ) : (
              <video
                src={heroVideos[0].media_url}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </div>
        )}
        {heroVideos.length === 0 && (
          <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground/95 to-foreground/90" />
        )}
        <div className="container mx-auto px-4 text-center relative z-10 py-20">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-primary font-display text-xs tracking-[0.4em] uppercase mb-4"
          >
            {isVi ? 'Nhà hàng Tuấn Đạt Luxury' : 'Tuấn Đạt Luxury Restaurant'}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold mb-5"
          >
            {isVi ? 'Ẩm thực đẳng cấp biển Sầm Sơn' : 'Premium Sầm Sơn Seafood Cuisine'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-background/70 max-w-2xl mx-auto text-sm sm:text-base mb-8"
          >
            {isVi
              ? 'Hải sản tươi sống đánh bắt trong ngày, chế biến bởi đầu bếp giàu kinh nghiệm. Từ bàn ăn gia đình đến tiệc đoàn — mọi bữa ăn đều là trải nghiệm.'
              : 'Fresh seafood caught daily, prepared by experienced chefs. From family dining to group feasts — every meal is an experience.'}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {ctaButton}
          </motion.div>
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="flex items-center gap-1.5 text-sm text-background/50">
              <Clock className="h-4 w-4 text-primary" />
              <span>10:00 – 21:00</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-background/30" />
            <div className="flex items-center gap-1.5 text-sm text-background/50">
              <Phone className="h-4 w-4 text-primary" />
              <span>098.360.5768</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. VIDEO NGẮN (Reels) ===== */}
      {shortVideos.length > 0 && (
        <section className="py-16 sm:py-24 bg-secondary">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <p className="text-primary font-display text-xs tracking-[0.3em] uppercase mb-2">
                {isVi ? 'Trải nghiệm' : 'EXPERIENCE'}
              </p>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-foreground">
                {isVi ? 'Khoảnh khắc tại nhà hàng' : 'Restaurant Moments'}
              </h2>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
              {shortVideos.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="aspect-[9/16] rounded-2xl overflow-hidden bg-muted relative group"
                >
                  <video
                    src={v.media_url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="none"
                    onMouseEnter={e => (e.target as HTMLVideoElement).play().catch(() => {})}
                    onMouseLeave={e => { const vid = e.target as HTMLVideoElement; vid.pause(); vid.currentTime = 0; }}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all flex items-center justify-center">
                    <Play className="h-8 w-8 text-white/80 group-hover:opacity-0 transition-opacity" />
                  </div>
                  {v.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="text-white text-xs line-clamp-2">{v.caption}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== 3. HÌNH ẢNH + MOMENT KHÁCH ===== */}
      {(images.length > 0 || moments.length > 0) && (
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            {images.length > 0 && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-10"
                >
                  <p className="text-primary font-display text-xs tracking-[0.3em] uppercase mb-2">
                    {isVi ? 'Hình ảnh' : 'GALLERY'}
                  </p>
                  <h2 className="font-display text-2xl sm:text-4xl font-bold text-foreground">
                    {isVi ? 'Không gian & Ẩm thực' : 'Space & Cuisine'}
                  </h2>
                </motion.div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-10">
                  {images.map((img, i) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="aspect-video rounded-xl overflow-hidden bg-muted cursor-pointer group"
                      onClick={() => setLightboxImg(img.media_url)}
                    >
                      <img
                        src={img.media_url}
                        alt={img.title || ''}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {moments.length > 0 && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-10 mt-16"
                >
                  <p className="text-primary font-display text-xs tracking-[0.3em] uppercase mb-2">
                    {isVi ? 'Khách hàng chia sẻ' : 'GUEST MOMENTS'}
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                    {isVi ? 'Khoảnh khắc của khách hàng' : 'Guest Experiences'}
                  </h2>
                </motion.div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {moments.map((m, i) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.04 }}
                      className="rounded-xl overflow-hidden bg-muted cursor-pointer group"
                      onClick={() => setLightboxImg(m.media_url)}
                    >
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={m.media_url}
                          alt={m.caption || ''}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      {m.caption && (
                        <div className="p-2">
                          <p className="text-xs text-muted-foreground line-clamp-2">{m.caption}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {/* Mid CTA */}
            <div className="text-center mt-12">{ctaButton}</div>
          </div>
        </section>
      )}

      {/* ===== 4. ĐẶC SẢN NỔI BẬT - Ảnh Menu ===== */}
      {menuPhotos.length > 0 && (
        <section className="py-16 sm:py-24 bg-secondary">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <p className="text-primary font-display text-xs tracking-[0.3em] uppercase mb-2">
                {isVi ? 'Đặc sản nổi bật' : 'SIGNATURE DISHES'}
              </p>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-foreground mb-3">
                {isVi ? 'Món ngon từ bếp Tuấn Đạt' : 'From Our Kitchen'}
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm">
                {isVi
                  ? 'Mỗi món ăn là một câu chuyện — từ hải sản tươi sống đánh bắt trong ngày đến những công thức gia truyền độc đáo.'
                  : 'Each dish tells a story — from daily-caught fresh seafood to unique family recipes.'}
              </p>
            </motion.div>

            {/* Menu groups */}
            {[
              { items: menuLe, labelVi: 'Menu lẻ', labelEn: 'À la carte' },
              { items: menuDoan, labelVi: 'Menu đoàn', labelEn: 'Group Menu' },
              { items: menuCombo, labelVi: 'Combo', labelEn: 'Combo Set' },
              { items: menuGeneral, labelVi: '', labelEn: '' },
            ]
              .filter(g => g.items.length > 0)
              .map((group, gi) => (
                <div key={gi} className="mb-10">
                  {group.labelVi && (
                    <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <UtensilsCrossed className="h-4 w-4 text-primary" />
                      {isVi ? group.labelVi : group.labelEn}
                    </h3>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.items.map((photo, i) => (
                      <motion.div
                        key={photo.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.06 }}
                        className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300 cursor-pointer group"
                        onClick={() => setLightboxImg(photo.media_url)}
                      >
                        <div className="overflow-hidden">
                          <img
                            src={photo.media_url}
                            alt={photo.title || 'Menu'}
                            className="w-full object-contain max-h-[500px] group-hover:scale-[1.02] transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                        {photo.title && (
                          <div className="p-3 sm:p-4">
                            <h4 className="font-display text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                              {photo.title}
                            </h4>
                            {photo.caption && (
                              <p className="text-xs text-muted-foreground mt-1">{photo.caption}</p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}

            <div className="text-center mt-8">{ctaButton}</div>
          </div>
        </section>
      )}

      {/* ===== 5. USP HIGHLIGHTS ===== */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: <Waves className="h-10 w-10 text-primary mx-auto" />,
                titleVi: 'Hải sản tươi sống',
                titleEn: 'Fresh Seafood',
                descVi: 'Tôm, cua, ghẹ, mực, hàu — tất cả đều được đánh bắt trong ngày từ biển Sầm Sơn.',
                descEn: 'Shrimp, crab, squid, oysters — all caught daily from Sầm Sơn sea.',
              },
              {
                icon: <Clock className="h-10 w-10 text-primary mx-auto" />,
                titleVi: 'Buffet sáng miễn phí',
                titleEn: 'Free Breakfast Buffet',
                descVi: 'Buffet sáng đa dạng tại tầng 1. Món Việt và quốc tế, phục vụ 06:00 – 08:30.',
                descEn: 'Rich breakfast buffet at 1st floor. Vietnamese and international, served 06:00 – 08:30.',
              },
              {
                icon: <ChefHat className="h-10 w-10 text-primary mx-auto" />,
                titleVi: 'Đầu bếp chuyên nghiệp',
                titleEn: 'Expert Chefs',
                descVi: 'Đội ngũ đầu bếp kinh nghiệm 10+ năm, chuyên hải sản & ẩm thực Việt.',
                descEn: '10+ years experienced chef team, specializing in seafood & Vietnamese cuisine.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="space-y-4"
              >
                {item.icon}
                <h3 className="font-display text-lg font-bold text-foreground">{isVi ? item.titleVi : item.titleEn}</h3>
                <p className="text-sm text-muted-foreground">{isVi ? item.descVi : item.descEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 6. FINAL CTA ===== */}
      <section className="py-20 sm:py-28 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="font-display text-2xl sm:text-4xl font-bold mb-4">
              {isVi ? 'Xem là muốn ăn ngay!' : 'See It, Crave It!'}
            </h2>
            <p className="text-background/60 mb-8 text-sm sm:text-base">
              {isVi
                ? 'Đặt món trực tuyến — giao nhanh tại khách sạn hoặc liên hệ đặt bàn cho đoàn.'
                : 'Order online — fast delivery to hotel or contact us to book a table for your group.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {ctaButton}
              <a href="tel:0983605768">
                <Button variant="outline" size="lg" className="gap-2 border-background/30 text-background hover:bg-background/10">
                  <Phone className="h-4 w-4" /> 098.360.5768
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            onClick={() => setLightboxImg(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={lightboxImg}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Cuisine;
