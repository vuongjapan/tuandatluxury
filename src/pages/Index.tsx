import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import BookingSearch from '@/components/BookingSearch';
import RoomCard from '@/components/RoomCard';
import Footer from '@/components/Footer';
import { useRooms } from '@/hooks/useRooms';
import { useServices } from '@/hooks/useServices';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
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

const SectionHeader = ({ tagline, title, isVi }: { tagline: string; title: string; isVi: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    className="text-center mb-12 sm:mb-16"
  >
    <p className="text-primary font-display text-xs sm:text-sm tracking-[0.35em] uppercase mb-3">
      {tagline}
    </p>
    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-5">
      {title}
    </h2>
    <div className="flex items-center justify-center gap-3">
      <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-primary/70" />
      <div className="w-2 h-2 rounded-full bg-primary/70" />
      <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-primary/70" />
    </div>
  </motion.div>
);

const Index = () => {
  const { t } = useLanguage();
  const { rooms, loading: roomsLoading } = useRooms();
  const { amenities } = useServices();
  const { settings: siteSettings } = useSiteSettings();
  const navigate = useNavigate();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* 1. Hero - fullscreen video/image */}
      <HeroSection />

      {/* 2. Booking Search */}
      <BookingSearch />

      {/* 3. Về chúng tôi — compact intro */}
      <section id="about" className="py-20 sm:py-28 bg-secondary luxury-section">
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(hsl(43 74% 49%) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              {/* Left: Image */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="relative"
              >
                {siteSettings.about_image_url ? (
                  <img
                    src={siteSettings.about_image_url}
                    alt="Tuấn Đạt Luxury Hotel"
                    className="w-full h-[400px] sm:h-[500px] object-cover rounded-2xl shadow-luxury"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-[400px] sm:h-[500px] bg-muted rounded-2xl flex items-center justify-center">
                    <span className="text-6xl">🏨</span>
                  </div>
                )}
                <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground rounded-xl px-5 py-3 shadow-lg">
                  <p className="font-display text-2xl font-bold">5★</p>
                  <p className="text-xs">FLC Sầm Sơn</p>
                </div>
              </motion.div>

              {/* Right: Content */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <p className="text-primary font-display text-xs sm:text-sm tracking-[0.35em] uppercase mb-3">
                  {isVi ? 'Về chúng tôi' : 'About Us'}
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  Tuấn Đạt Luxury Hotel
                </h2>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-[1px] bg-primary/70" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/70" />
                  <div className="w-12 h-[1px] bg-primary/70" />
                </div>
                <p className="text-primary font-medium text-sm mb-4">
                  ✦ {isVi ? 'Nghỉ dưỡng đẳng cấp trong khu FLC Sầm Sơn 5 sao' : 'Premium resort inside FLC Sầm Sơn 5-star complex'} ✦
                </p>
                <div className="space-y-3 text-muted-foreground text-sm sm:text-base leading-relaxed">
                  <p>
                    {isVi
                      ? 'Tọa lạc trong khu nghỉ dưỡng cao cấp 5 sao FLC Sầm Sơn — khu nghỉ dưỡng đầu tiên của miền Bắc và Bắc Trung Bộ. Khách sạn Tuấn Đạt Luxury gồm 6 tầng với hơn 19 phòng nghỉ sang trọng, chỉ cách bãi biển 50m. Mỗi phòng đều được trang bị điều hòa, TV màn hình phẳng, minibar, tủ lạnh, máy sấy tóc, ban công riêng và thiết bị vệ sinh cao cấp.'
                      : 'Located inside the prestigious FLC Sầm Sơn 5-star resort — the first resort of Northern and North Central Vietnam. Tuấn Đạt Luxury Hotel features 6 floors with 19+ luxury rooms, just 50m from the beach. Each room is equipped with air conditioning, flat-screen TV, minibar, refrigerator, hair dryer, private balcony and premium bathroom amenities.'}
                  </p>
                  <p>
                    {isVi
                      ? 'Khách sạn có 2 nhà hàng tại tầng 1 & 2 phục vụ hải sản tươi sống Sầm Sơn và ẩm thực Việt-Quốc tế. Sân thượng tầng 6 là khu Bar-Coffee với không gian sôi động, ngắm cảnh biển thơ mộng. Check-in: 14:00 | Check-out: 12:00.'
                      : 'The hotel has 2 restaurants on floors 1 & 2 serving fresh Sầm Sơn seafood and Vietnamese-International cuisine. The 6th-floor rooftop features a Bar-Coffee area with lively atmosphere and romantic sea views. Check-in: 14:00 | Check-out: 12:00.'}
                  </p>
                </div>

                {/* Free amenities */}
                <div className="mt-6 p-4 bg-card rounded-xl border border-border">
                  <p className="font-semibold text-sm mb-3 flex items-center gap-2">
                    🎁 {isVi ? 'Miễn phí khi nghỉ tại khách sạn:' : 'Complimentary amenities:'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    {[
                      { icon: '🏊', text: isVi ? 'Bể bơi vô cực view biển' : 'Infinity pool, sea view' },
                      { icon: '🚲', text: isVi ? 'Xe đạp đôi dạo FLC' : 'Tandem bikes in FLC' },
                      { icon: '🎤', text: isVi ? 'Karaoke sân khấu ánh sáng' : 'Karaoke stage' },
                      { icon: '🏞️', text: isVi ? 'Tham quan toàn khu FLC 5 sao' : 'Tour FLC 5-star complex' },
                      { icon: '📶', text: isVi ? 'Wifi Internet 24/7' : 'Wifi 24/7' },
                      { icon: '🚐', text: isVi ? 'Xe điện đưa đón bãi biển' : 'Beach shuttle' },
                      { icon: '💧', text: isVi ? '2 chai nước + trà, cafe/ngày' : '2 water bottles + tea, coffee/day' },
                      { icon: '🅿️', text: isVi ? 'Bãi đỗ xe an ninh 24/7' : 'Secure parking 24/7' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span>{item.icon}</span>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact info */}
                <div className="mt-4 p-4 bg-card rounded-xl border border-border text-sm space-y-1 text-muted-foreground">
                  <p>📍 LK29-20, FLC Sầm Sơn, Thanh Hóa</p>
                  <p>📞 098.661.7939 • 091.693.0969</p>
                  <p>✉️ tuandatluxury@gmail.com</p>
                </div>
              </motion.div>
            </div>

            {/* Nearby attractions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              {[
                { icon: '🏊', titleVi: 'Hồ bơi vô cực', titleEn: 'Infinity Pool', descVi: 'Miễn phí, view biển', descEn: 'Free, sea view' },
                { icon: '🍽️', titleVi: '2 Nhà hàng', titleEn: '2 Restaurants', descVi: 'Hải sản & quốc tế', descEn: 'Seafood & international' },
                { icon: '🍸', titleVi: 'Rooftop Bar', titleEn: 'Rooftop Bar', descVi: 'Tầng 6, ngắm biển', descEn: 'Floor 6, sea view' },
                { icon: '🛎️', titleVi: 'Lễ tân 24/7', titleEn: '24/7 Reception', descVi: 'Dịch vụ phòng', descEn: 'Room service' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="bg-card rounded-2xl p-5 sm:p-6 text-center border border-border shadow-card hover:shadow-luxury hover:-translate-y-2 transition-all duration-500 gold-border-glow"
                >
                  <span className="text-3xl sm:text-4xl block mb-2">{item.icon}</span>
                  <p className="font-display text-sm font-semibold text-foreground">{isVi ? item.titleVi : item.titleEn}</p>
                  <p className="text-xs text-muted-foreground mt-1">{isVi ? item.descVi : item.descEn}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Nearby places */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 bg-card rounded-xl border border-border p-5 sm:p-6 max-w-2xl mx-auto"
            >
              <h3 className="font-display text-base font-semibold mb-4 flex items-center gap-2">
                📍 {isVi ? 'Điểm tham quan lân cận' : 'Nearby Attractions'}
              </h3>
              <div className="space-y-2">
                {[
                  { name: isVi ? 'Bãi biển Sầm Sơn' : 'Sầm Sơn Beach', dist: '50m' },
                  { name: isVi ? 'Quảng trường biển' : 'Beach Square', dist: isVi ? '2 phút xe' : '2 min drive' },
                  { name: isVi ? 'Công viên nước' : 'Water Park', dist: isVi ? '5 phút xe' : '5 min drive' },
                  { name: isVi ? 'Đền Độc Cước' : 'Doc Cuoc Temple', dist: isVi ? '10 phút xe' : '10 min drive' },
                  { name: isVi ? 'Hòn Trống Mái' : 'Trong Mai Rock', dist: isVi ? '12 phút xe' : '12 min drive' },
                  { name: isVi ? 'Sân Golf FLC' : 'FLC Golf Course', dist: isVi ? '3 phút xe' : '3 min drive' },
                ].map((place, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-sm text-foreground">{place.name}</span>
                    <span className="text-xs text-primary font-medium">{place.dist}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. Phòng nổi bật */}
      <section id="rooms" className="py-20 sm:py-28 bg-background luxury-section">
        <div className="container mx-auto px-4">
          <SectionHeader
            tagline={isVi ? 'Hạng phòng' : 'Accommodation'}
            title={isVi ? 'Phòng nghỉ cao cấp' : 'Exceptional Rooms'}
            isVi={isVi}
          />
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

      {/* 5. Dịch vụ nổi bật (4-6 items) */}
      <section id="services" className="py-16 sm:py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <SectionHeader
            tagline={isVi ? 'Tiện ích' : 'Facilities'}
            title={t('nav.services')}
            isVi={isVi}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {amenities.slice(0, 6).map((s, idx) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="bg-card rounded-2xl p-5 sm:p-6 text-center shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 border border-border"
              >
                <span className="text-3xl sm:text-4xl mb-3 block">{s.icon}</span>
                <h3 className="font-display text-sm sm:text-base font-semibold mb-1">{isVi ? s.name_vi : s.name_en}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{isVi ? s.description_vi : s.description_en}</p>
                {s.is_free && (
                  <Badge variant="outline" className="mt-2 text-xs border-primary/30 text-primary">
                    {isVi ? 'Miễn phí' : 'Free'}
                  </Badge>
                )}
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button variant="gold" size="lg" onClick={() => navigate('/services')} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {isVi ? 'Xem tất cả dịch vụ' : 'View all services'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* 6. Ẩm thực preview */}
      <Suspense fallback={<SectionFallback />}>
        <DiningSection />
      </Suspense>

      {/* 7. Thư viện ảnh */}
      <Suspense fallback={<SectionFallback />}>
        <PhotoGallery />
      </Suspense>

      {/* 8. Ưu đãi */}
      <Suspense fallback={<SectionFallback />}>
        <PromotionsSection />
      </Suspense>

      {/* 9. Đánh giá */}
      <Suspense fallback={<SectionFallback />}>
        <TestimonialsSection />
      </Suspense>

      {/* 10. CTA đặt phòng lớn */}
      <section className="py-20 sm:py-28 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/95 to-foreground" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-primary font-display text-xs tracking-[0.4em] uppercase mb-3">
              {isVi ? 'Sẵn sàng cho kỳ nghỉ?' : 'Ready for your stay?'}
            </p>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-background mb-4">
              {isVi ? 'Đặt phòng ngay hôm nay' : 'Book Your Stay Today'}
            </h2>
            <p className="text-background/60 max-w-lg mx-auto mb-8 text-sm sm:text-base">
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
                  📞 098.360.5768
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 11. Bản đồ */}
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
