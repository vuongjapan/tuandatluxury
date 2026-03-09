import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import RoomCard from '@/components/RoomCard';
import Footer from '@/components/Footer';
import { useRooms } from '@/hooks/useRooms';
import { useServices } from '@/hooks/useServices';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Lazy load heavy below-fold components
const PhotoGallery = lazy(() => import('@/components/PhotoGallery'));
const PromotionsSection = lazy(() => import('@/components/PromotionsSection'));
const MapSection = lazy(() => import('@/components/MapSection'));
const DiningSection = lazy(() => import('@/components/DiningHomeSection'));
const FloatingButtons = lazy(() => import('@/components/FloatingButtons'));

const SectionFallback = () => (
  <div className="py-12 flex items-center justify-center">
    <div className="animate-pulse h-8 bg-muted rounded w-48" />
  </div>
);

const RoomSkeleton = () => (
  <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col md:flex-row animate-pulse">
    <div className="w-full md:w-80 h-48 sm:h-56 bg-muted shrink-0" />
    <div className="flex-1 p-4 sm:p-6 space-y-3">
      <div className="h-6 bg-muted rounded w-2/3" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="flex gap-2 mt-4">
        <div className="h-6 bg-muted rounded-full w-16" />
        <div className="h-6 bg-muted rounded-full w-16" />
        <div className="h-6 bg-muted rounded-full w-16" />
      </div>
    </div>
  </div>
);

const Index = () => {
  const { t } = useLanguage();
  const { rooms, loading: roomsLoading } = useRooms();
  const { amenities } = useServices();
  const navigate = useNavigate();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />

      {/* Rooms Section */}
      <section id="rooms" className="py-12 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">{t('nav.rooms')}</h2>
            <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full" />
          </div>

          <div className="space-y-6">
            {roomsLoading && rooms.length === 0 ? (
              <>
                <RoomSkeleton />
                <RoomSkeleton />
                <RoomSkeleton />
              </>
            ) : (
              rooms.map((room, i) => (
                <RoomCard key={room.id} room={room} index={i} />
              ))
            )}
          </div>
        </div>
      </section>

      <Suspense fallback={<SectionFallback />}>
        <PhotoGallery />
      </Suspense>

      {/* About Section */}
      <section id="about" className="py-12 sm:py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">{t('nav.about')}</h2>
            <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full mb-8" />
            <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">{t('footer.desc')}</p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-12 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">{t('nav.services')}</h2>
            <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
            {amenities.slice(0, 8).map((s) => (
              <div
                key={s.id}
                className="bg-card rounded-xl p-4 sm:p-6 text-center shadow-card transition-shadow duration-300 border border-border"
              >
                <span className="text-3xl sm:text-4xl mb-3 block">{s.icon}</span>
                <h3 className="font-display text-xs sm:text-base font-semibold mb-1">{isVi ? s.name_vi : s.name_en}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{isVi ? s.description_vi : s.description_en}</p>
                {s.is_free && (
                  <Badge variant="outline" className="mt-2 text-xs border-primary/30 text-primary">
                    {isVi ? 'Miễn phí' : 'Free'}
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="gold" size="lg" onClick={() => navigate('/services')}>
              <Sparkles className="h-4 w-4 mr-2" />
              {isVi ? 'Xem tất cả dịch vụ & đặt dịch vụ' : 'View all services & book'}
            </Button>
          </div>
        </div>
      </section>

      <Suspense fallback={<SectionFallback />}>
        <DiningSection />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <PromotionsSection />
      </Suspense>

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
