import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Phone } from 'lucide-react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import BookingSearch from '@/components/BookingSearch';
import RoomsCarousel from '@/components/RoomsCarousel';
import PromoBanner from '@/components/PromoBanner';
import IntroSection from '@/components/IntroSection';

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
const LocationSection = lazy(() => import('@/components/LocationSection'));
const DiningSection = lazy(() => import('@/components/DiningHomeSection'));
const FloatingButtons = lazy(() => import('@/components/FloatingButtons'));
const TestimonialsSection = lazy(() => import('@/components/TestimonialsSection'));
const RestaurantSection = lazy(() => import('@/components/RestaurantSection'));
const ServicesSection = lazy(() => import('@/components/ServicesSection'));

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

      {/* [1] Video Hero */}
      <HeroSection />

      {/* [2] Thanh tìm kiếm / đặt phòng */}
      <BookingSearch />

      {/* [3] Banner Ưu đãi nổi bật */}
      <PromoBanner />

      {/* [3.5] Giới thiệu — Kỳ Nghỉ Ngập Tràn Niềm Vui */}
      <IntroSection />

      {/* [4] Hạng phòng — carousel */}
      {roomsLoading && safeRooms.length === 0 ? (
        <section className="py-16 sm:py-24 bg-background">
          <div className="section-container space-y-4">
            <RoomSkeleton /><RoomSkeleton />
          </div>
        </section>
      ) : (
        <RoomsCarousel rooms={visibleRooms} />
      )}

      {/* [5] Thư viện ảnh */}
      <Suspense fallback={<SectionFallback />}>
        <PhotoGallery />
      </Suspense>

      {/* [6] Ẩm thực */}
      <Suspense fallback={<SectionFallback />}>
        <RestaurantSection />
      </Suspense>

      {/* [6.5] Dịch vụ / Tiện ích */}
      <Suspense fallback={<SectionFallback />}>
        <ServicesSection />
      </Suspense>

      {/* [7] Khám phá Sầm Sơn */}
      <section className="py-20 sm:py-28 bg-secondary">
        <div className="section-container">
          <SectionHeader
            tagline={isVi ? 'Khám phá' : 'Discover'}
            title={isVi ? 'Khám phá Sầm Sơn' : 'Explore Sầm Sơn'}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {safeAttractions.slice(0, 6).map((a, idx) => (
              <FadeIn key={a.id} delay={idx * 60}>
                <button
                  onClick={() => navigate('/kham-pha')}
                  className="block w-full text-left bg-card rounded-xl overflow-hidden border border-border shadow-card hover:shadow-luxury hover:-translate-y-1 transition-all duration-500 group"
                >
                  {a.image_url ? (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={a.image_url}
                        alt={isVi ? a.name_vi : a.name_en}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        width={600}
                        height={450}
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-muted" />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-display text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {isVi ? a.name_vi : a.name_en}
                      </h3>
                      {a.distance && (
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary shrink-0">
                          {a.distance}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {(isVi ? a.description_vi : a.description_en) || (isVi ? 'Điểm tham quan nổi bật tại Sầm Sơn' : 'Featured attraction in Sầm Sơn')}
                    </p>
                  </div>
                </button>
              </FadeIn>
            ))}
          </div>
          <FadeIn className="text-center mt-10">
            <Button variant="gold" size="lg" onClick={() => navigate('/kham-pha')} className="gap-2 tracking-wider">
              <Sparkles className="h-4 w-4" />
              {isVi ? 'Khám phá tất cả' : 'Explore all'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* [7.5] Vị trí & Cách di chuyển */}
      <Suspense fallback={<SectionFallback />}>
        <LocationSection />
      </Suspense>

      {/* [8] Footer */}
      <Footer />
      <Suspense fallback={null}>
        <FloatingButtons />
      </Suspense>
    </div>
  );
};

export default Index;

