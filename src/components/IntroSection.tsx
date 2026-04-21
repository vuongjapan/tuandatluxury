import { useEffect, useRef, useState } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const DEFAULTS = {
  intro_title: 'Kỳ Nghỉ Ngập Tràn Niềm Vui',
  intro_description:
    'Tọa lạc ngay trong khu nghỉ dưỡng FLC Sầm Sơn 5 sao — khu nghỉ dưỡng biển đầu tiên miền Bắc và Bắc Trung Bộ — Khách sạn Tuấn Đạt Luxury mang đến trải nghiệm sang trọng chỉ cách bãi biển 50m. Với 19 phòng thiết kế hiện đại, hồ bơi vô cực tầng thượng view biển, nhà hàng hải sản 2 tầng và đội ngũ phục vụ tận tâm 24/7, chúng tôi cam kết mỗi kỳ nghỉ của quý khách sẽ là những kỷ niệm đáng nhớ nhất.',
  intro_photo_1_url:
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
  intro_photo_1_cap: 'Hồ bơi vô cực — Tầng 6 · View biển FLC',
  intro_photo_2_url:
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  intro_photo_2_cap: 'Nhà hàng hải sản — 2 tầng · 120+ món đặc sản',
  intro_photo_3_url:
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
  intro_photo_3_cap: 'Phòng nghỉ sang trọng — 19 phòng · Check-in 14:00',
};

const IntroSection = () => {
  const { settings } = useSiteSettings();
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  const get = (k: keyof typeof DEFAULTS) =>
    (settings?.[k] as string) || DEFAULTS[k];

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const photos = [
    { url: get('intro_photo_1_url'), cap: get('intro_photo_1_cap') },
    { url: get('intro_photo_2_url'), cap: get('intro_photo_2_cap') },
    { url: get('intro_photo_3_url'), cap: get('intro_photo_3_cap') },
  ];

  return (
    <section ref={sectionRef} className="bg-background overflow-hidden">
      {/* TOP — Title & description */}
      <div className="section-container text-center pt-16 pb-10">
        <div
          className="mx-auto mb-5"
          style={{
            width: 40,
            height: 2,
            background: '#C9A84C',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
          }}
        />
        <h2
          className="font-display"
          style={{
            color: '#1B3A5C',
            fontWeight: 400,
            fontSize: 'clamp(26px, 4vw, 40px)',
            lineHeight: 1.2,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.6s ease-out 0.05s, transform 0.6s ease-out 0.05s',
          }}
        >
          {get('intro_title')}
        </h2>
        <p
          className="mx-auto mt-6"
          style={{
            maxWidth: 740,
            fontFamily: 'Inter, sans-serif',
            fontSize: 16,
            lineHeight: 1.85,
            color: '#555',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.6s ease-out 0.15s, transform 0.6s ease-out 0.15s',
          }}
        >
          {get('intro_description')}
        </p>
      </div>

      {/* BOTTOM — 3 full-bleed photos chạm mép màn hình */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-0"
        style={{
          width: '100vw',
          maxWidth: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
        }}
      >
        {photos.map((p, i) => (
          <figure
            key={i}
            className="group block m-0"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(16px)',
              transition: `opacity 0.6s ease-out ${i * 0.15}s, transform 0.6s ease-out ${i * 0.15}s`,
            }}
          >
            <div className="relative overflow-hidden">
              <img
                src={p.url}
                alt={p.cap}
                loading="lazy"
                className="w-full block transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                style={{ height: 'clamp(220px, 28vw, 360px)', objectFit: 'cover', objectPosition: 'center' }}
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'rgba(27,58,92,0.2)' }}
              />
            </div>
            <figcaption
              className="text-center"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                color: '#666',
                padding: '12px 8px 0',
              }}
            >
              {p.cap}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
};

export default IntroSection;
