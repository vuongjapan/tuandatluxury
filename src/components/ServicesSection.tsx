import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { useServices, type Service } from '@/hooks/useServices';

const badgeClassFor = (color: string | null | undefined) => {
  switch (color) {
    case 'navy':
      return 'bg-[#1B3A5C] text-white';
    case 'teal':
      return 'bg-teal-600 text-white';
    case 'gold':
    default:
      return 'bg-[#C9A84C] text-[#1B3A5C]';
  }
};

const ServiceCard = ({
  s,
  index,
  sectionVisible,
  isVi,
  onClick,
}: {
  s: Service;
  index: number;
  sectionVisible: boolean;
  isVi: boolean;
  onClick: (link: string | null) => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [inView, setInView] = useState(false);

  // Per-card observer for fade/slide effects
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Parallax effect
  useEffect(() => {
    if (s.image_effect !== 'parallax') return;
    const handle = () => {
      const card = cardRef.current;
      const img = imgRef.current;
      if (!card || !img) return;
      const rect = card.getBoundingClientRect();
      const offset = (rect.top / window.innerHeight) * 20;
      img.style.transform = `translateY(${offset}px) scale(1.1)`;
    };
    window.addEventListener('scroll', handle, { passive: true });
    handle();
    return () => window.removeEventListener('scroll', handle);
  }, [s.image_effect]);

  const effect = s.image_effect || 'zoom';

  // Entrance animation per effect
  let entranceStyle: React.CSSProperties = {};
  if (effect === 'fade') {
    entranceStyle = {
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(30px)',
      transition: `opacity 0.7s ease-out ${index * 0.1}s, transform 0.7s ease-out ${index * 0.1}s`,
    };
  } else if (effect === 'slide') {
    entranceStyle = {
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(50px)',
      transition: `opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.12}s, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.12}s`,
    };
  } else {
    // zoom + parallax: still get section stagger entrance
    entranceStyle = {
      opacity: sectionVisible ? 1 : 0,
      transform: sectionVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.6s ease-out ${index * 0.12}s, transform 0.6s ease-out ${index * 0.12}s`,
    };
  }

  const imgClass =
    effect === 'zoom'
      ? 'w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]'
      : 'w-full h-full object-cover';

  return (
    <div
      ref={cardRef}
      className="service-card group bg-card rounded-xl overflow-hidden border border-border shadow-card hover:shadow-luxury hover:-translate-y-1 transition-all duration-500 h-full flex flex-col"
      style={entranceStyle}
      data-effect={effect}
    >
      <div className="relative h-[220px] overflow-hidden bg-secondary">
        {s.image_url ? (
          <img
            ref={imgRef}
            src={s.image_url}
            alt={s.name}
            loading="lazy"
            width={600}
            height={220}
            className={imgClass}
            style={effect === 'parallax' ? { willChange: 'transform' } : undefined}
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        {s.badge_text && (
          <span
            className={`absolute top-3 left-3 ${badgeClassFor(s.badge_color)} text-[11px] font-medium px-3 py-1 rounded-full tracking-wide shadow-sm`}
          >
            {s.badge_text}
          </span>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">{s.name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
          {s.description}
        </p>
        {s.button_text && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onClick(s.button_link)}
            className="mt-4 self-start border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
          >
            {s.button_text}
          </Button>
        )}
      </div>
    </div>
  );
};

const ServicesSection = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isVi = language === 'vi';
  const { featured } = useServices();
  const sectionRef = useRef<HTMLElement>(null);
  const [sectionVisible, setSectionVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSectionVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleClick = (link: string | null) => {
    if (!link) return;
    if (link.startsWith('http') || link.startsWith('tel:') || link.startsWith('mailto:')) {
      window.open(link, link.startsWith('http') ? '_blank' : '_self');
    } else {
      navigate(link);
    }
  };

  if (featured.length === 0) return null;

  // Split into rows: first row up to 3, next row remaining (centered)
  const row1 = featured.slice(0, 3);
  const row2 = featured.slice(3);

  return (
    <section ref={sectionRef} className="py-20 sm:py-28 bg-background">
      <div className="section-container">
        <div
          className="text-center mb-12 sm:mb-16"
          style={{
            opacity: sectionVisible ? 1 : 0,
            transform: sectionVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
          }}
        >
          <p className="text-primary font-display text-xs tracking-[0.3em] uppercase mb-3 font-medium">
            {t('service.label')}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-4 tracking-tight">
            {t('service.title')}
          </h2>
          <div className="w-[50px] h-[2px] bg-primary mx-auto mb-4" />
          <p
            className="text-sm text-muted-foreground max-w-xl mx-auto"
            style={{
              opacity: sectionVisible ? 1 : 0,
              transition: 'opacity 0.5s ease-out 0.15s',
            }}
          >
            {isVi
              ? 'Trải nghiệm trọn vẹn với hệ thống tiện ích cao cấp dành cho khách lưu trú.'
              : 'A complete experience with premium amenities for our guests.'}
          </p>
        </div>

        {/* Mobile: horizontal scroll. Desktop (sm+): grid */}
        <div className="sm:hidden overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
          <div className="flex gap-4 pb-4 w-max">
            {featured.map((s, idx) => (
              <div key={s.id} className="snap-start shrink-0 w-[260px]">
                <ServiceCard s={s} index={idx} sectionVisible={sectionVisible} isVi={isVi} onClick={handleClick} />
              </div>
            ))}
          </div>
          <p className="text-xs text-center text-muted-foreground mt-1">{isVi ? '← Vuốt ngang để xem thêm →' : '← Swipe to explore →'}</p>
        </div>

        {/* Desktop grid */}
        <div className="hidden sm:block">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {row1.map((s, idx) => (
              <ServiceCard
                key={s.id}
                s={s}
                index={idx}
                sectionVisible={sectionVisible}
                isVi={isVi}
                onClick={handleClick}
              />
            ))}
          </div>

          {row2.length > 0 && (
            <div
              className={`mt-6 grid gap-6 max-w-6xl mx-auto ${
                row2.length === 1
                  ? 'sm:grid-cols-1 lg:grid-cols-1 lg:max-w-md'
                  : row2.length === 2
                  ? 'sm:grid-cols-2 lg:grid-cols-2 lg:max-w-3xl'
                  : 'sm:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {row2.map((s, idx) => (
                <ServiceCard
                  key={s.id}
                  s={s}
                  index={row1.length + idx}
                  sectionVisible={sectionVisible}
                  isVi={isVi}
                  onClick={handleClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
