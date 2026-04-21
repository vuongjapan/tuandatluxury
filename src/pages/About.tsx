import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Utensils, HeartHandshake, BadgePercent, X, ZoomIn, Navigation } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FadeIn from '@/components/FadeIn';
import { Button } from '@/components/ui/button';
import { useInView } from '@/hooks/useInView';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const HOTEL_MAP_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.2167792564705!2d105.91047087504556!3d19.759731681590715!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3136515bf8afa3fd%3A0x5a29458949901908!2zS2jDoWNoIHPhuqFuIFR14bqlbiDEkOG6oXQgTHV4dXJ5IFPhuqdtIFPGoW4!5e1!3m2!1svi!2sjp!4v1772983874554!5m2!1svi!2sjp';
const HOTEL_MAP_LINK = 'https://maps.app.goo.gl/pBbcvrqXQQT4PVfn6';

const HERO_IMG =
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80&auto=format&fit=crop';

const STORY_IMG =
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80&auto=format&fit=crop';

const GALLERY = [
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=900&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=900&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1559599238-308793637427?w=900&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=900&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519690889869-e705e59f72e1?w=900&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=900&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=900&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=900&q=80&auto=format&fit=crop',
];

const VALUES = [
  { icon: MapPin, title: 'Vị trí đắc địa', desc: 'Ngay trong FLC Sầm Sơn, 5 phút tới biển, view hồ bơi và biển.' },
  { icon: Utensils, title: 'Hải sản tươi mỗi ngày', desc: 'Nhà hàng 2 tầng, 120+ món, đánh bắt tại Sầm Sơn.' },
  { icon: HeartHandshake, title: 'Dịch vụ tận tâm', desc: 'Đội ngũ phục vụ 24/7, hỗ trợ đặt tour và đón tiễn sân bay.' },
  { icon: BadgePercent, title: 'Giá trực tiếp tốt nhất', desc: 'Đặt qua web rẻ hơn Booking/Agoda, không qua trung gian.' },
];

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const { ref, inView } = useInView();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.floor(p * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return (
    <span ref={ref as any} className="font-display text-4xl md:text-5xl font-bold text-primary">
      {n}
      {suffix}
    </span>
  );
}

const About = () => {
  const { settings } = useSiteSettings();
  const [lightbox, setLightbox] = useState<string | null>(null);
  const heroImg = settings.about_image_url || HERO_IMG;

  useEffect(() => {
    document.title = 'Giới thiệu | Tuấn Đạt Luxury — FLC Sầm Sơn';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Tuấn Đạt Luxury Hotel — boutique 3 sao tại FLC Sầm Sơn với 19 phòng tinh tế, nhà hàng hải sản và hồ bơi vô cực tầng thượng.');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* SECTION 1 — HERO */}
      <section className="relative w-full overflow-hidden" style={{ height: '60vh', minHeight: 420 }}>
        <img src={heroImg} alt="Tuấn Đạt Luxury Hotel" className="absolute inset-0 w-full h-full object-cover scale-105 animate-[heroZoom_18s_ease-in-out_infinite_alternate]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <FadeIn>
            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold text-white tracking-wide drop-shadow-lg">
              KHÁCH SẠN TUẤN ĐẠT LUXURY
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="mt-4 text-base sm:text-lg md:text-xl text-white/90 italic">
              FLC Sầm Sơn, Thanh Hóa — Nơi Biển Cả Gặp Đẳng Cấp
            </p>
            <div className="w-24 h-1 bg-gold-gradient mx-auto rounded-full mt-5" />
          </FadeIn>
        </div>
        <style>{`@keyframes heroZoom{from{transform:scale(1.05)}to{transform:scale(1.15)}}`}</style>
      </section>

      {/* SECTION 2 — STORY */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
          <FadeIn direction="left">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-card">
              <img src={STORY_IMG} alt="Tuấn Đạt Luxury" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
            </div>
          </FadeIn>
          <FadeIn direction="right">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3">Về Chúng Tôi</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-5">
              Boutique giữa lòng FLC Sầm Sơn
            </h2>
            <div className="w-16 h-1 bg-gold-gradient rounded-full mb-5" />
            <p className="text-muted-foreground leading-relaxed text-base">
              Tuấn Đạt Luxury là khách sạn boutique tiêu chuẩn 3 sao tọa lạc ngay trong khu nghỉ dưỡng FLC Sầm Sơn — một trong những quần thể du lịch biển lớn nhất miền Bắc Việt Nam. Với 19 phòng được thiết kế tinh tế, nhà hàng hải sản 2 tầng và hồ bơi vô cực tầng thượng, chúng tôi mang đến trải nghiệm nghỉ dưỡng trọn vẹn giữa lòng Sầm Sơn.
            </p>

            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border">
              <div className="text-center">
                <CountUp to={19} />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Phòng</p>
              </div>
              <div className="text-center">
                <CountUp to={120} suffix="+" />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Món ăn</p>
              </div>
              <div className="text-center">
                <CountUp to={5} />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Năm hoạt động</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* SECTION 3 — CORE VALUES */}
      <section className="py-16 sm:py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3">Giá trị cốt lõi</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Điều làm nên Tuấn Đạt</h2>
              <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full mt-4" />
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <FadeIn key={v.title} delay={i * 120}>
                  <div className="group bg-card rounded-xl p-6 h-full border border-border shadow-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="w-14 h-14 rounded-full bg-gold-gradient flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">{v.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4 — GALLERY MASONRY */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-10">
              <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3">Thư viện ảnh</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Khoảnh khắc tại Tuấn Đạt</h2>
              <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full mt-4" />
            </div>
          </FadeIn>
          <div className="columns-2 md:columns-3 gap-4 [column-fill:_balance]">
            {GALLERY.map((src, i) => (
              <FadeIn key={src} delay={(i % 6) * 100}>
                <button
                  onClick={() => setLightbox(src)}
                  className="group relative block w-full mb-4 break-inside-avoid overflow-hidden rounded-xl shadow-card focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <img
                    src={src}
                    alt={`Tuan Dat Luxury ${i + 1}`}
                    loading="lazy"
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — LOCATION */}
      <section className="py-16 sm:py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-10">
              <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3">Vị trí & Đi lại</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Cách di chuyển đến Tuấn Đạt</h2>
              <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full mt-4" />
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            <FadeIn direction="left">
              <div className="rounded-xl overflow-hidden border border-border shadow-card h-full min-h-[360px]">
                <iframe
                  src={HOTEL_MAP_EMBED}
                  className="w-full h-full min-h-[360px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Vị trí Tuấn Đạt Luxury"
                  allowFullScreen
                />
              </div>
            </FadeIn>
            <FadeIn direction="right">
              <div className="bg-card rounded-xl p-6 sm:p-8 border border-border shadow-card h-full">
                <h3 className="font-display text-xl font-bold mb-5 text-foreground">Khoảng cách di chuyển</h3>
                <ul className="space-y-4">
                  {[
                    { from: 'Từ Hà Nội', dist: '~160 km', time: 'khoảng 2.5 giờ lái xe' },
                    { from: 'Từ sân bay Thọ Xuân', dist: '~45 km', time: '~50 phút' },
                    { from: 'Từ ga Thanh Hóa', dist: '~20 km', time: '~25 phút' },
                  ].map((r) => (
                    <li key={r.from} className="flex gap-3 pb-3 border-b border-border/50 last:border-0">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Navigation className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{r.from}</p>
                        <p className="text-sm text-muted-foreground">{r.dist} — {r.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 p-4 bg-secondary rounded-lg">
                  <p className="text-sm text-foreground"><strong>Dịch vụ đón tiễn:</strong> Liên hệ lễ tân <a href="tel:0384418811" className="text-primary font-semibold">038.441.8811</a> để đặt xe.</p>
                </div>
                <Button variant="gold" className="mt-6 w-full" asChild>
                  <a href={HOTEL_MAP_LINK} target="_blank" rel="noopener noreferrer">
                    <MapPin className="h-4 w-4 mr-2" /> Xem bản đồ lớn
                  </a>
                </Button>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* SECTION 6 — CTA */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: '#1B3A5C' }}>
        <div className="container mx-auto px-4 text-center">
          <FadeIn>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Sẵn sàng trải nghiệm kỳ nghỉ tuyệt vời?
            </h2>
            <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full mb-6" />
            <p className="text-white/80 text-base sm:text-lg mb-8 max-w-xl mx-auto">
              Đặt phòng trực tiếp qua website để nhận giá ưu đãi tốt nhất và nhiều quà tặng độc quyền.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="gold" size="lg" className="text-base font-bold px-8" asChild>
                <Link to="/booking">Đặt phòng ngay</Link>
              </Button>
              <Button variant="outline" size="lg" className="text-base bg-transparent border-white text-white hover:bg-white hover:text-foreground" asChild>
                <a href="tel:0384418811">Liên hệ chúng tôi</a>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      <Footer />

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setLightbox(null)}
            aria-label="Đóng"
          >
            <X className="h-6 w-6" />
          </button>
          <img src={lightbox} alt="Phóng to" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
};

export default About;
