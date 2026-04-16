import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Phone } from 'lucide-react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import BookingSearch from '@/components/BookingSearch';
import RoomCard from '@/components/RoomCard';
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <BookingSearch />

      {/* 1. Phòng nghỉ */}
      <section id="rooms" className="py-20 sm:py-28 bg-background luxury-section">
        <div className="container mx-auto px-4">
          <SectionHeader
            tagline={isVi ? 'Hạng phòng' : 'Accommodation'}
            title={isVi ? 'Phòng nghỉ cao cấp' : 'Exceptional Rooms'}
          />
          <div className="space-y-8 sm:space-y-10">
            {roomsLoading && safeRooms.length === 0 ? (
              <><RoomSkeleton /><RoomSkeleton /><RoomSkeleton /></>
            ) : (
              safeRooms.map((room, i) => (
                <FadeIn key={room.id} delay={i * 100}>
                  <RoomCard room={room} index={i} />
                </FadeIn>
              ))
            )}
          </div>
          <FadeIn className="text-center mt-10 sm:mt-14">
            <Button variant="gold" size="lg" onClick={() => navigate('/booking')} className="gap-2 text-sm px-10 py-5 tracking-wider uppercase">
              {t('hero.book_now')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* 2. Về chúng tôi */}
      <section id="about" className="py-20 sm:py-28 bg-secondary luxury-section">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <FadeIn direction="left">
                <div className="relative">
                  {siteSettings.about_image_url ? (
                    <img
                      src={siteSettings.about_image_url}
                      alt="Tuấn Đạt Luxury Hotel"
                      className="w-full aspect-video object-cover rounded-2xl shadow-luxury"
                      loading="lazy"
                      width={640}
                      height={360}
                    />
                  ) : (
                    <div className="w-full aspect-video bg-muted rounded-2xl flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">Hotel Image</span>
                    </div>
                  )}
                  <div className="absolute -bottom-3 -right-3 bg-primary text-primary-foreground rounded-xl px-4 py-2 shadow-lg">
                    <p className="font-display text-xl font-bold">5★</p>
                    <p className="text-[10px]">FLC Sầm Sơn</p>
                  </div>
                </div>
              </FadeIn>

              <FadeIn direction="right">
                <p className="text-primary font-display text-[11px] sm:text-xs tracking-[0.35em] uppercase mb-3 font-medium">
                  {isVi ? 'Về chúng tôi' : 'About Us'}
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-4 tracking-tight">
                  Tuấn Đạt Luxury Hotel
                </h2>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-[1px] bg-primary/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                  <div className="w-12 h-[1px] bg-primary/50" />
                </div>
                <p className="text-primary font-medium text-xs sm:text-sm mb-4">
                  {isVi ? 'Nghỉ dưỡng đẳng cấp trong khu FLC Sầm Sơn 5 sao' : 'Premium resort inside FLC Sầm Sơn 5-star complex'}
                </p>
                <div className="space-y-3 text-muted-foreground text-xs sm:text-sm leading-relaxed">
                  <p>
                    {isVi
                      ? 'Tọa lạc trong khu nghỉ dưỡng cao cấp 5 sao FLC Sầm Sơn — khu nghỉ dưỡng đầu tiên của miền Bắc và Bắc Trung Bộ. Khách sạn Tuấn Đạt Luxury gồm 6 tầng với hơn 19 phòng nghỉ sang trọng, chỉ cách bãi biển 50m.'
                      : 'Located inside the prestigious FLC Sầm Sơn 5-star resort. Tuấn Đạt Luxury Hotel features 6 floors with 19+ luxury rooms, just 50m from the beach.'}
                  </p>
                  <p>
                    {isVi
                      ? 'Khách sạn có 2 nhà hàng tại tầng 1 & 2 phục vụ hải sản tươi sống và ẩm thực Việt-Quốc tế. Sân thượng tầng 6 là khu Bar-Coffee ngắm biển. Check-in: 14:00 | Check-out: 12:00.'
                      : 'The hotel has 2 restaurants serving fresh seafood and Vietnamese-International cuisine. 6th-floor rooftop Bar-Coffee with sea views. Check-in: 14:00 | Check-out: 12:00.'}
                  </p>
                </div>

                <div className="mt-6 p-4 sm:p-5 bg-card rounded-xl border border-border">
                  <p className="font-semibold text-xs sm:text-sm mb-3">
                    {isVi ? 'Miễn phí khi nghỉ tại khách sạn:' : 'Complimentary amenities:'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs text-muted-foreground">
                    {[
                      isVi ? 'Bể bơi vô cực view biển' : 'Infinity pool, sea view',
                      isVi ? 'Xe đạp đôi dạo FLC' : 'Tandem bikes in FLC',
                      isVi ? 'Karaoke sân khấu ánh sáng' : 'Karaoke stage',
                      isVi ? 'Tham quan toàn khu FLC 5 sao' : 'Tour FLC 5-star complex',
                      isVi ? 'Wifi Internet 24/7' : 'Wifi 24/7',
                      isVi ? 'Xe điện đưa đón bãi biển' : 'Beach shuttle',
                      isVi ? '2 chai nước + trà, cafe/ngày' : '2 water bottles + tea, coffee/day',
                      isVi ? 'Bãi đỗ xe an ninh 24/7' : 'Secure parking 24/7',
                    ].map((text, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 p-4 sm:p-5 bg-card rounded-xl border border-border text-xs sm:text-sm space-y-1.5 text-muted-foreground">
                  <p>LK29-20, FLC Sầm Sơn, Thanh Hóa</p>
                  <p>098.661.7939 · 091.693.0969</p>
                  <p>tuandatluxuryflc36hotel@gmail.com</p>
                </div>
              </FadeIn>
            </div>

            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
              {[
                { titleVi: 'Hồ bơi vô cực', titleEn: 'Infinity Pool', descVi: 'Miễn phí, view biển', descEn: 'Free, sea view', key: 'pool' },
                { titleVi: '2 Nhà hàng', titleEn: '2 Restaurants', descVi: 'Hải sản & quốc tế', descEn: 'Seafood & international', key: 'restaurant' },
                { titleVi: 'Rooftop Bar', titleEn: 'Rooftop Bar', descVi: 'Tầng 6, ngắm biển', descEn: 'Floor 6, sea view', key: 'bar' },
                { titleVi: 'Lễ tân 24/7', titleEn: '24/7 Reception', descVi: 'Dịch vụ phòng', descEn: 'Room service', key: 'reception' },
              ].map((item, idx) => {
                const imgMap: Record<string, string> = {
                  pool: siteSettings.feature_pool_url || '',
                  restaurant: siteSettings.feature_restaurant_url || '',
                  bar: siteSettings.feature_bar_url || '',
                  reception: siteSettings.feature_reception_url || '',
                };
                const imgSrc = imgMap[item.key];
                return (
                  <FadeIn key={idx} delay={idx * 80}>
                    <div className="bg-card rounded-xl overflow-hidden border border-border shadow-card hover:shadow-luxury hover:-translate-y-1 transition-all duration-500">
                      <div className="aspect-video overflow-hidden">
                        {imgSrc ? (
                          <img src={imgSrc} alt={isVi ? item.titleVi : item.titleEn} className="w-full h-full object-cover" loading="lazy" width={400} height={225} />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground text-sm font-display">{(isVi ? item.titleVi : item.titleEn).charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4 text-center">
                        <p className="font-display text-xs sm:text-sm font-semibold text-foreground">{isVi ? item.titleVi : item.titleEn}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{isVi ? item.descVi : item.descEn}</p>
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Khách hàng nói gì */}
      <Suspense fallback={<SectionFallback />}>
        <TestimonialsSection />
      </Suspense>

      {/* 4. Điểm tham quan lân cận */}
      <section id="nearby" className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4">
          <SectionHeader
            tagline={isVi ? 'Khám phá' : 'Explore'}
            title={isVi ? 'Điểm tham quan lân cận' : 'Nearby Attractions'}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
            {safeAttractions.map((place, idx) => (
              <FadeIn key={place.id} delay={idx * 60}>
                <div className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-luxury hover:-translate-y-1 transition-all duration-300">
                  {place.image_url ? (
                    <div className="aspect-video overflow-hidden">
                      <img src={place.image_url} alt={isVi ? place.name_vi : place.name_en} className="w-full h-full object-cover" loading="lazy" width={400} height={225} />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <span className="text-4xl">{place.icon}</span>
                    </div>
                  )}
                  <div className="p-4 text-center">
                    <p className="font-display text-sm sm:text-base font-semibold text-foreground mb-1">{isVi ? place.name_vi : place.name_en}</p>
                    <p className="text-xs text-primary font-medium mb-2">{place.distance}</p>
                    {(isVi ? place.description_vi : place.description_en) && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {isVi ? place.description_vi : place.description_en}
                      </p>
                    )}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
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
