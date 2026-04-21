import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Phone } from 'lucide-react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import BookingSearch from '@/components/BookingSearch';
import RoomsCarousel from '@/components/RoomsCarousel';

import Footer from '@/components/Footer';
import FadeIn from '@/components/FadeIn';
import { useRooms } from '@/hooks/useRooms';
import { useServices } from '@/hooks/useServices';
import { useAttractions } from '@/hooks/useAttractions';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PhotoGallery = lazy(() => import('@/components/PhotoGallery'));
const PromotionsSection = lazy(() => import('@/components/PromotionsSection'));
const MapSection = lazy(() => import('@/components/MapSection'));
const DiningSection = lazy(() => import('@/components/DiningHomeSection'));
const FloatingButtons = lazy(() => import('@/components/FloatingButtons'));
const TestimonialsSection = lazy(() => import('@/components/TestimonialsSection'));
const RestaurantSection = lazy(() => import('@/components/RestaurantSection'));

const SectionFallback = () => (
  <div className="py-12 flex items-center justify-center">
    <div className="animate-pulse h-8 bg-muted rounded w-48" />
  </div>
);

const RoomSkeleton = () => (
  <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col md:flex-row animate-pulse">
    <div className="w-full md:w-80 aspect-video md:aspect-auto bg-muted shrink-0" />
    <div className="flex-1 p-4 sm:p-6 space-y-3">
      <div className="h-6 bg-muted rounded w-2/3" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="flex gap-2 mt-4">
        <div className="h-6 bg-muted rounded-full w-16" />
        <div className="h-6 bg-muted rounded-full w-16" />
      </div>
    </div>
  </div>
);

const SectionHeader = ({ tagline, title }: { tagline: string; title: string }) => (
  <FadeIn className="text-center mb-12 sm:mb-16">
    <p className="text-primary font-display text-[11px] sm:text-xs tracking-[0.35em] uppercase mb-3 font-medium">
      {tagline}
    </p>
    <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground mb-5 tracking-tight">
      {title}
    </h2>
    <div className="flex items-center justify-center gap-3">
      <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-primary/50" />
      <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
      <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-primary/50" />
    </div>
  </FadeIn>
);

const Index = () => {
  const { t } = useLanguage();
  const { rooms, loading: roomsLoading } = useRooms();
  const { amenities } = useServices();
  const { attractions } = useAttractions();
  const { settings: siteSettings } = useSiteSettings();
  const navigate = useNavigate();
  const isVi = t('nav.rooms') === 'Hạng phòng';
  const safeRooms = Array.isArray(rooms) ? rooms : [];
  const safeAmenities = Array.isArray(amenities) ? amenities : [];
  const safeAttractions = Array.isArray(attractions) ? attractions : [];
  const visibleRooms = safeRooms;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <BookingSearch />

      {/* 1. Phòng nghỉ - Carousel kiểu Vinpearl */}
      {roomsLoading && safeRooms.length === 0 ? (
        <section className="py-16 sm:py-24 bg-background">
          <div className="container mx-auto px-4 space-y-4">
            <RoomSkeleton /><RoomSkeleton />
          </div>
        </section>
      ) : (
        <RoomsCarousel rooms={visibleRooms} />
      )}

      {/* 3. Khách hàng nói gì */}
      <Suspense fallback={<SectionFallback />}>
        <TestimonialsSection />
      </Suspense>

      {/* 3.5 Nhà hàng & Ẩm thực */}
      <Suspense fallback={<SectionFallback />}>
        <RestaurantSection />
      </Suspense>

      {/* 4. Banner Khám phá Sầm Sơn */}
      <section className="py-12 sm:py-16 bg-background">
        <div className="container mx-auto px-4">
          <FadeIn>
            <button
              onClick={() => navigate('/kham-pha')}
              className="block w-full max-w-5xl mx-auto rounded-2xl overflow-hidden relative group bg-gradient-to-r from-foreground to-foreground/80 hover:shadow-luxury transition-all duration-500"
            >
              <div className="px-6 sm:px-12 py-10 sm:py-14 text-background flex items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-primary text-[11px] tracking-[0.35em] uppercase mb-2">
                    {isVi ? 'Khám phá' : 'Discover'}
                  </p>
                  <h3 className="font-display text-xl sm:text-3xl font-semibold">
                    {isVi ? 'Khám phá Sầm Sơn' : 'Explore Sầm Sơn'}
                  </h3>
                  <p className="text-xs sm:text-sm text-background/70 mt-2">
                    {isVi ? 'Bãi biển · Ẩm thực · Điểm tham quan' : 'Beaches · Cuisine · Attractions'}
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 sm:h-8 sm:w-8 text-primary group-hover:translate-x-2 transition-transform" />
              </div>
            </button>
          </FadeIn>
        </div>
      </section>

      {/* 5. Dịch vụ */}
      <section id="services" className="py-20 sm:py-28 bg-secondary luxury-section">
        <div className="container mx-auto px-4">
          <SectionHeader
            tagline={isVi ? 'Tiện ích' : 'Facilities'}
            title={t('nav.services')}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 max-w-4xl mx-auto">
            {safeAmenities.slice(0, 6).map((s, idx) => (
              <FadeIn key={s.id} delay={idx * 80}>
                <div className="bg-card rounded-xl overflow-hidden shadow-card hover:shadow-luxury hover:-translate-y-1 transition-all duration-500 border border-border group">
                  {s.image_url ? (
                    <div className="aspect-video overflow-hidden">
                      <img src={s.image_url} alt={isVi ? s.name_vi : s.name_en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={400} height={225} />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <span className="text-primary font-display text-3xl font-bold">{(isVi ? s.name_vi : s.name_en).charAt(0)}</span>
                    </div>
                  )}
                  <div className="p-3 sm:p-4 text-center">
                    <h3 className="font-display text-xs sm:text-sm font-semibold mb-1 group-hover:text-primary transition-colors duration-300">{isVi ? s.name_vi : s.name_en}</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed">{isVi ? s.description_vi : s.description_en}</p>
                    {s.is_free && (
                      <Badge variant="outline" className="mt-2 text-[10px] border-primary/30 text-primary">
                        {isVi ? 'Miễn phí' : 'Free'}
                      </Badge>
                    )}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn className="text-center mt-10">
            <Button variant="gold" size="lg" onClick={() => navigate('/services')} className="gap-2 tracking-wider">
              <Sparkles className="h-4 w-4" />
              {isVi ? 'Xem tất cả dịch vụ' : 'View all services'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* 6. Khuyến mãi */}
      <Suspense fallback={<SectionFallback />}>
        <PromotionsSection />
      </Suspense>

      {/* 7. Ẩm thực */}
      <Suspense fallback={<SectionFallback />}>
        <DiningSection />
      </Suspense>

      {/* 8. Thư viện ảnh */}
      <Suspense fallback={<SectionFallback />}>
        <PhotoGallery />
      </Suspense>

      {/* CTA đặt phòng */}
      <section className="py-24 sm:py-32 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(hsl(43 74% 49%) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <FadeIn>
            <p className="text-primary font-display text-[11px] tracking-[0.35em] uppercase mb-3 font-medium">
              {isVi ? 'Sẵn sàng cho kỳ nghỉ?' : 'Ready for your stay?'}
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-semibold text-background mb-4 tracking-tight">
              {isVi ? 'Đặt phòng ngay hôm nay' : 'Book Your Stay Today'}
            </h2>
            <p className="text-background/60 max-w-lg mx-auto mb-8 text-xs sm:text-sm leading-relaxed">
              {isVi
                ? 'Liên hệ ngay để nhận ưu đãi tốt nhất. Đặt cọc chỉ 50%, thanh toán phần còn lại khi nhận phòng.'
                : 'Contact us for the best deals. Only 50% deposit required, pay the rest at check-in.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="hero"
                size="lg"
                onClick={() => navigate('/booking')}
                className="text-sm px-10 py-5 tracking-widest uppercase font-semibold"
              >
                {t('hero.book_now')}
              </Button>
              <a href="tel:0983605768">
                <Button variant="outline" size="lg" className="text-background border-background/30 hover:bg-background/10 bg-transparent gap-2">
                  <Phone className="h-4 w-4" /> 098.360.5768
                </Button>
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Bản đồ */}
      <Suspense fallback={<SectionFallback />}>
        <MapSection />
      </Suspense>

      <Footer />
      <Suspense fallback={null}>
        <FloatingButtons />
      </Suspense>
    </div>
  );
};

export default Index;
