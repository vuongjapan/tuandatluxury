import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import SpotlightSection from '@/components/SpotlightSection';
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
const TestimonialsSection = lazy(() => import('@/components/TestimonialsSection'));

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

      {/* Spotlight Section - like Imperial's "In The Spotlight" */}
      <div className="pt-12 sm:pt-14">
        <SpotlightSection />
      </div>

      {/* Rooms Section */}
      <section id="rooms" className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-primary font-display text-sm tracking-[0.25em] uppercase mb-2">
              {isVi ? 'Hạng phòng' : 'Accommodation'}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              {isVi ? 'Phòng nghỉ cao cấp' : 'Exceptional Rooms'}
            </h2>
            <div className="w-20 h-[2px] bg-primary mx-auto" />
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

      {/* About Section - side-by-side layout */}
      <section id="about" className="py-16 sm:py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Text side */}
              <div>
                <p className="text-primary font-display text-sm tracking-[0.25em] uppercase mb-2">
                  {isVi ? 'Về chúng tôi' : 'About Us'}
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  {isVi ? 'Tuấn Đạt Luxury Hotel' : 'Tuấn Đạt Luxury Hotel'}
                </h2>
                <div className="w-16 h-[2px] bg-primary mb-6" />
                <p className="text-primary font-display text-base sm:text-lg font-semibold mb-4">
                  {isVi
                    ? '✦ Điểm đến nghỉ dưỡng lý tưởng tại FLC Sầm Sơn ✦'
                    : '✦ Your Ideal Resort Destination at FLC Sầm Sơn ✦'}
                </p>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base mb-6">
                  {isVi
                    ? 'Tọa lạc tại vị trí đắc địa trong khu nghỉ dưỡng FLC Sầm Sơn, Khách sạn Tuấn Đạt Luxury mang đến trải nghiệm lưu trú đẳng cấp với thiết kế hiện đại, tiện nghi sang trọng và dịch vụ tận tâm. Chỉ vài bước chân đến bãi biển, khách sạn là lựa chọn hoàn hảo cho kỳ nghỉ gia đình, du lịch nhóm hay nghỉ dưỡng lãng mạn.'
                    : 'Located in a prime position within the prestigious FLC Sầm Sơn resort complex, Tuấn Đạt Luxury Hotel offers an upscale stay experience with modern design, premium amenities and attentive service. Just steps from the beach, the hotel is the perfect choice for family vacations, group trips or romantic getaways.'}
                </p>
                <div className="p-4 bg-card rounded-xl border border-border">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    📍 LK29-20, FLC Sầm Sơn, Thanh Hóa<br />
                    📞 098.661.7939<br />
                    ✉️ tuandatluxury@gmail.com
                  </p>
                </div>
              </div>

              {/* Stats / features side */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {[
                  { icon: '🏊', titleVi: 'Hồ bơi vô cực', titleEn: 'Infinity Pool', descVi: 'Mở quanh năm', descEn: 'Open year-round' },
                  { icon: '🍽️', titleVi: 'Nhà hàng', titleEn: 'Restaurant', descVi: 'Buffet sáng miễn phí', descEn: 'Free breakfast buffet' },
                  { icon: '🏖️', titleVi: 'Giáp biển', titleEn: 'Beachfront', descVi: 'Đưa đón miễn phí', descEn: 'Free shuttle' },
                  { icon: '🛎️', titleVi: 'Dịch vụ 24/7', titleEn: '24/7 Service', descVi: 'Lễ tân & phòng', descEn: 'Reception & room' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-card rounded-xl p-5 sm:p-6 text-center border border-border shadow-card">
                    <span className="text-3xl sm:text-4xl block mb-3">{item.icon}</span>
                    <p className="font-display text-sm sm:text-base font-semibold text-foreground">
                      {isVi ? item.titleVi : item.titleEn}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{isVi ? item.descVi : item.descEn}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-primary font-display text-sm tracking-[0.25em] uppercase mb-2">
              {isVi ? 'Tiện ích' : 'Facilities'}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t('nav.services')}
            </h2>
            <div className="w-20 h-[2px] bg-primary mx-auto" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
            {amenities.slice(0, 8).map((s) => (
              <div
                key={s.id}
                className="bg-card rounded-xl p-4 sm:p-6 text-center shadow-card hover:shadow-card-hover transition-shadow duration-300 border border-border"
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
        <TestimonialsSection />
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
