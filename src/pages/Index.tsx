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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
              {/* Text side */}
              <div>
                <p className="text-primary font-display text-sm tracking-[0.25em] uppercase mb-2">
                  {isVi ? 'Về chúng tôi' : 'About Us'}
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  Tuấn Đạt Luxury Hotel
                </h2>
                <div className="w-16 h-[2px] bg-primary mb-6" />
                <p className="text-primary font-display text-base sm:text-lg font-semibold mb-4">
                  {isVi
                    ? '✦ Nghỉ dưỡng đẳng cấp trong khu FLC Sầm Sơn 5 sao ✦'
                    : '✦ Premium Stay inside FLC Sầm Sơn 5-Star Resort ✦'}
                </p>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base mb-4">
                  {isVi
                    ? 'Tọa lạc trong khu nghỉ dưỡng cao cấp 5 sao FLC Sầm Sơn — khu nghỉ dưỡng đầu tiên của miền Bắc và Bắc Trung Bộ. Khách sạn Tuấn Đạt Luxury gồm 6 tầng với hơn 19 phòng nghỉ sang trọng, chỉ cách bãi biển 50m. Mỗi phòng đều được trang bị điều hòa, TV màn hình phẳng, minibar, tủ lạnh, máy sấy tóc, ban công riêng và thiết bị vệ sinh cao cấp.'
                    : 'Located inside the prestigious FLC Sầm Sơn — the first 5-star resort in Northern and North-Central Vietnam. Tuấn Đạt Luxury Hotel features 6 floors with 19+ luxury rooms, just 50m from the beach. Each room is equipped with AC, flat-screen TV, minibar, fridge, hair dryer, private balcony and premium bathroom fixtures.'}
                </p>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base mb-6">
                  {isVi
                    ? 'Khách sạn có 2 nhà hàng tại tầng 1 & 2 phục vụ hải sản tươi sống Sầm Sơn và ẩm thực Việt-Quốc tế. Sân thượng tầng 6 là khu Bar-Coffee với không gian sôi động, ngắm cảnh biển thơ mộng. Check-in: 14:00 | Check-out: 12:00.'
                    : 'The hotel features 2 restaurants on floors 1 & 2 serving fresh Sầm Sơn seafood and Vietnamese-International cuisine. The 6th floor rooftop houses a vibrant Bar-Coffee area with romantic sea views. Check-in: 14:00 | Check-out: 12:00.'}
                </p>

                {/* Free amenities list */}
                <div className="p-4 sm:p-5 bg-card rounded-xl border border-border mb-4">
                  <h4 className="font-display text-sm font-semibold text-foreground mb-3">
                    {isVi ? '🎁 Miễn phí khi nghỉ tại khách sạn:' : '🎁 Complimentary for all guests:'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {(isVi ? [
                      '🏊 Bể bơi vô cực view biển',
                      '🚲 Xe đạp đôi dạo FLC',
                      '🎤 Karaoke sân khấu ánh sáng',
                      '🎫 Tham quan toàn khu FLC 5 sao',
                      '📶 Wifi Internet 24/7',
                      '🚐 Xe điện đưa đón bãi biển',
                      '💧 2 chai nước + trà, cafe/ngày',
                      '🅿️ Bãi đỗ xe an ninh 24/7',
                    ] : [
                      '🏊 Infinity pool with sea view',
                      '🚲 Tandem bikes around FLC',
                      '🎤 Karaoke with stage lighting',
                      '🎫 Full FLC 5-star resort access',
                      '📶 24/7 WiFi Internet',
                      '🚐 Free beach electric shuttle',
                      '💧 2 water bottles + tea, coffee/day',
                      '🅿️ 24/7 secure parking',
                    ]).map((item, idx) => (
                      <p key={idx} className="text-xs sm:text-sm text-muted-foreground">{item}</p>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-card rounded-xl border border-border">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    📍 LK29-20, FLC Sầm Sơn, Thanh Hóa<br />
                    📞 098.661.7939 • 091.693.0969<br />
                    ✉️ tuandatluxury@gmail.com
                  </p>
                </div>
              </div>

              {/* Right side - features + nearby */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: '🏊', titleVi: 'Hồ bơi vô cực', titleEn: 'Infinity Pool', descVi: 'Miễn phí, view biển', descEn: 'Free, sea view' },
                    { icon: '🍽️', titleVi: '2 Nhà hàng', titleEn: '2 Restaurants', descVi: 'Hải sản & quốc tế', descEn: 'Seafood & international' },
                    { icon: '🍸', titleVi: 'Rooftop Bar', titleEn: 'Rooftop Bar', descVi: 'Tầng 6, ngắm biển', descEn: 'Floor 6, sea view' },
                    { icon: '🛎️', titleVi: 'Lễ tân 24/7', titleEn: '24/7 Reception', descVi: 'Dịch vụ phòng', descEn: 'Room service' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-card rounded-xl p-4 sm:p-5 text-center border border-border shadow-card">
                      <span className="text-3xl sm:text-4xl block mb-2">{item.icon}</span>
                      <p className="font-display text-sm font-semibold text-foreground">
                        {isVi ? item.titleVi : item.titleEn}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{isVi ? item.descVi : item.descEn}</p>
                    </div>
                  ))}
                </div>

                {/* Nearby attractions */}
                <div className="bg-card rounded-xl p-5 border border-border shadow-card">
                  <h4 className="font-display text-sm font-semibold text-foreground mb-3">
                    {isVi ? '📍 Điểm tham quan lân cận' : '📍 Nearby Attractions'}
                  </h4>
                  <div className="space-y-2">
                    {(isVi ? [
                      { name: 'Bãi biển Sầm Sơn', dist: '50m' },
                      { name: 'Quảng trường biển', dist: '2 phút xe' },
                      { name: 'Công viên nước', dist: '5 phút xe' },
                      { name: 'Đền Độc Cước', dist: '10 phút xe' },
                      { name: 'Hòn Trống Mái', dist: '12 phút xe' },
                      { name: 'Chợ Cột Đỏ', dist: '8 phút xe' },
                      { name: 'Sân Golf FLC', dist: '3 phút xe' },
                    ] : [
                      { name: 'Sầm Sơn Beach', dist: '50m' },
                      { name: 'Sea Square', dist: '2 min drive' },
                      { name: 'Water Park', dist: '5 min drive' },
                      { name: 'Độc Cước Temple', dist: '10 min drive' },
                      { name: 'Trống Mái Rock', dist: '12 min drive' },
                      { name: 'Cột Đỏ Market', dist: '8 min drive' },
                      { name: 'FLC Golf Course', dist: '3 min drive' },
                    ]).map((place, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{place.name}</span>
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{place.dist}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
