import { useNavigate } from 'react-router-dom';
import { Waves, UtensilsCrossed, Wifi, Bike, Mic2, Car, Umbrella, Plane, BellRing } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import FadeIn from '@/components/FadeIn';
import { Button } from '@/components/ui/button';

const HERO_SERVICES = [
  {
    key: 'pool',
    icon: Waves,
    image: 'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=900&q=80&auto=format&fit=crop',
    title_vi: 'Hồ Bơi Vô Cực',
    title_en: 'Infinity Pool',
    desc_vi: 'Bể bơi tầng 6, view biển FLC toàn cảnh. Mở cửa 06:00–22:00. Miễn phí cho khách lưu trú.',
    desc_en: '6th-floor pool with panoramic FLC sea view. Open 06:00–22:00. Free for in-house guests.',
    badge_vi: 'Miễn phí',
    badge_en: 'Free',
    badgeClass: 'bg-primary text-primary-foreground',
    cta_vi: 'Khám phá',
    cta_en: 'Explore',
    href: '/dich-vu',
  },
  {
    key: 'restaurant',
    icon: UtensilsCrossed,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80&auto=format&fit=crop',
    title_vi: 'Nhà Hàng Hải Sản',
    title_en: 'Seafood Restaurant',
    desc_vi: '2 tầng phục vụ, 120+ món hải sản tươi. Mở cửa 07:00–21:30.',
    desc_en: '2 floors of service, 120+ fresh seafood dishes. Open 07:00–21:30.',
    badge_vi: 'Miễn phí',
    badge_en: 'Free',
    badgeClass: 'bg-teal-600 text-white',
    cta_vi: 'Xem thực đơn',
    cta_en: 'View menu',
    href: '/am-thuc',
  },
  {
    key: 'wifi',
    icon: Wifi,
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=900&q=80&auto=format&fit=crop',
    title_vi: 'WiFi Tốc Độ Cao',
    title_en: 'High-Speed WiFi',
    desc_vi: 'WiFi miễn phí tốc độ cao toàn bộ khách sạn. Kết nối ổn định 24/7.',
    desc_en: 'Free high-speed WiFi throughout the hotel. Stable 24/7 connectivity.',
    badge_vi: 'Miễn phí',
    badge_en: 'Free',
    badgeClass: 'bg-blue-600 text-white',
    cta_vi: 'Tìm hiểu',
    cta_en: 'Learn more',
    href: '/dich-vu',
  },
];

const MINI_SERVICES = [
  { icon: Bike, title_vi: 'Xe đạp đôi FLC', title_en: 'Tandem Bike (FLC)', tag_vi: 'Miễn phí', tag_en: 'Free' },
  { icon: Mic2, title_vi: 'Karaoke sân khấu', title_en: 'Stage Karaoke', tag_vi: 'Miễn phí', tag_en: 'Free' },
  { icon: Car, title_vi: 'Chỗ đỗ xe', title_en: 'Parking', tag_vi: 'Miễn phí', tag_en: 'Free' },
  { icon: BellRing, title_vi: 'Lễ tân 24/7', title_en: '24/7 Reception', tag_vi: 'Luôn có', tag_en: 'Always' },
  { icon: Umbrella, title_vi: 'Giáp biển', title_en: 'Beachfront', tag_vi: 'Miễn phí', tag_en: 'Free' },
  { icon: Plane, title_vi: 'Đón sân bay', title_en: 'Airport Pickup', tag_vi: 'Theo YC', tag_en: 'On request' },
];

const ServicesSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <FadeIn className="text-center mb-12 sm:mb-16">
          <p className="text-primary font-display text-xs tracking-[0.3em] uppercase mb-3 font-medium">
            {isVi ? 'TIỆN ÍCH' : 'AMENITIES'}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-4 tracking-tight">
            {isVi ? 'Dịch Vụ Của Chúng Tôi' : 'Our Services'}
          </h2>
          <div className="w-[50px] h-[2px] bg-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            {isVi
              ? 'Trải nghiệm trọn vẹn với hệ thống tiện ích cao cấp dành cho khách lưu trú.'
              : 'A complete experience with premium amenities for our guests.'}
          </p>
        </FadeIn>

        {/* Phần A: 3 card lớn */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-14">
          {HERO_SERVICES.map((s, idx) => {
            const Icon = s.icon;
            return (
              <FadeIn key={s.key} delay={idx * 150}>
                <div className="group bg-card rounded-xl overflow-hidden border border-border shadow-card hover:shadow-luxury hover:-translate-y-1 transition-all duration-500 h-full flex flex-col">
                  <div className="relative h-[220px] overflow-hidden">
                    <img
                      src={s.image}
                      alt={isVi ? s.title_vi : s.title_en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                      width={600}
                      height={220}
                    />
                    <span className={`absolute top-3 left-3 ${s.badgeClass} text-[11px] font-medium px-3 py-1 rounded-full tracking-wide`}>
                      {isVi ? s.badge_vi : s.badge_en}
                    </span>
                    <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-background/90 backdrop-blur flex items-center justify-center text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                      {isVi ? s.title_vi : s.title_en}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      {isVi ? s.desc_vi : s.desc_en}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(s.href)}
                      className="mt-4 self-start border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      {isVi ? s.cta_vi : s.cta_en} →
                    </Button>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* Phần B: 6 icon card nhỏ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
          {MINI_SERVICES.map((m, idx) => {
            const Icon = m.icon;
            return (
              <FadeIn key={m.title_en} delay={idx * 80}>
                <div className="group bg-card rounded-lg border border-border p-4 text-center transition-all duration-200 hover:border-primary hover:bg-secondary cursor-default h-full flex flex-col items-center justify-between gap-2">
                  <Icon className="h-8 w-8 text-primary mx-auto" />
                  <h4 className="text-sm font-medium text-foreground leading-tight">
                    {isVi ? m.title_vi : m.title_en}
                  </h4>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {isVi ? m.tag_vi : m.tag_en}
                  </span>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
