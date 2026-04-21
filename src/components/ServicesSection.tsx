import { useNavigate } from 'react-router-dom';
import { Bike, Mic2, Car, Umbrella, Plane, BellRing } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import FadeIn from '@/components/FadeIn';
import { Button } from '@/components/ui/button';
import { useServices } from '@/hooks/useServices';

const MINI_SERVICES = [
  { icon: Bike, title_vi: 'Xe đạp đôi FLC', title_en: 'Tandem Bike (FLC)', tag_vi: 'Miễn phí', tag_en: 'Free' },
  { icon: Mic2, title_vi: 'Karaoke sân khấu', title_en: 'Stage Karaoke', tag_vi: 'Miễn phí', tag_en: 'Free' },
  { icon: Car, title_vi: 'Chỗ đỗ xe', title_en: 'Parking', tag_vi: 'Miễn phí', tag_en: 'Free' },
  { icon: BellRing, title_vi: 'Lễ tân 24/7', title_en: '24/7 Reception', tag_vi: 'Luôn có', tag_en: 'Always' },
  { icon: Umbrella, title_vi: 'Giáp biển', title_en: 'Beachfront', tag_vi: 'Miễn phí', tag_en: 'Free' },
  { icon: Plane, title_vi: 'Đón sân bay', title_en: 'Airport Pickup', tag_vi: 'Theo YC', tag_en: 'On request' },
];

const badgeClassFor = (color: string | null | undefined) => {
  switch (color) {
    case 'navy': return 'bg-foreground text-background';
    case 'teal': return 'bg-teal-600 text-white';
    case 'gold':
    default: return 'bg-primary text-primary-foreground';
  }
};

const ServicesSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isVi = t('nav.rooms') === 'Hạng phòng';
  const { featured } = useServices();

  const handleClick = (link: string | null) => {
    if (!link) return;
    if (link.startsWith('http') || link.startsWith('tel:') || link.startsWith('mailto:')) {
      window.open(link, link.startsWith('http') ? '_blank' : '_self');
    } else {
      navigate(link);
    }
  };

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

        {/* Featured services from DB — responsive grid that auto-centers last row */}
        {featured.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto mb-14">
            {featured.map((s, idx) => (
              <FadeIn
                key={s.id}
                delay={idx * 150}
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
              >
                <div className="group bg-card rounded-xl overflow-hidden border border-border shadow-card hover:shadow-luxury hover:-translate-y-1 transition-all duration-500 h-full flex flex-col">
                  <div className="relative h-[220px] overflow-hidden bg-secondary">
                    {s.image_url && (
                      <img
                        src={s.image_url}
                        alt={isVi ? s.name_vi : s.name_en}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                        width={600}
                        height={220}
                      />
                    )}
                    {s.badge_text && (
                      <span className={`absolute top-3 left-3 ${badgeClassFor(s.badge_color)} text-[11px] font-medium px-3 py-1 rounded-full tracking-wide`}>
                        {s.badge_text}
                      </span>
                    )}
                    <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-background/90 backdrop-blur flex items-center justify-center text-primary text-lg">
                      <span aria-hidden="true">{s.icon}</span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                      {isVi ? s.name_vi : (s.name_en || s.name_vi)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      {isVi ? s.description_vi : (s.description_en || s.description_vi)}
                    </p>
                    {s.button_text && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClick(s.button_link)}
                        className="mt-4 self-start border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        {s.button_text} →
                      </Button>
                    )}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        )}

        {/* Mini icon cards */}
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
