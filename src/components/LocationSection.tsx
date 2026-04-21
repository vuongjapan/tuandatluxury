import { MapPin, Navigation, ExternalLink, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FadeIn from '@/components/FadeIn';
import { useLanguage } from '@/contexts/LanguageContext';

const MAPS_URL = 'https://maps.app.goo.gl/pBbcvrqXQQT4PVfn6';
const MAP_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.2167792564705!2d105.91047087504556!3d19.759731681590715!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3136515bf8afa3fd%3A0x5a29458949901908!2zS2jDoWNoIHPhuqFuIFR14bqlbiDEkOG6oXQgTHV4dXJ5IFPhuqdtIFPGoW4!5e1!3m2!1svi!2sjp!4v1772983874554!5m2!1svi!2sjp';

const LocationSection = () => {
  const { t } = useLanguage();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  const distances = [
    {
      name: isVi ? 'Từ Hà Nội' : 'From Hanoi',
      detail: isVi ? '~160 km — khoảng 2.5 giờ lái xe' : '~160 km — ~2.5 hours by car',
    },
    {
      name: isVi ? 'Từ sân bay Thọ Xuân' : 'From Thọ Xuân Airport',
      detail: isVi ? '~45 km — ~50 phút' : '~45 km — ~50 min',
    },
    {
      name: isVi ? 'Từ ga Thanh Hóa' : 'From Thanh Hoá Station',
      detail: isVi ? '~20 km — ~25 phút' : '~20 km — ~25 min',
    },
  ];

  return (
    <section className="py-16 sm:py-20" style={{ backgroundColor: '#FAF8F3' }}>
      <div className="section-container">
        <FadeIn className="text-center mb-10 sm:mb-12">
          <p className="text-primary font-display text-[11px] sm:text-xs uppercase mb-3 font-medium" style={{ letterSpacing: '0.25em' }}>
            {isVi ? 'Vị trí & Di lại' : 'Location & Travel'}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-[32px] font-semibold text-foreground mb-4 tracking-tight">
            {isVi ? 'Cách Di Chuyển Đến Tuấn Đạt' : 'How to Reach Tuấn Đạt'}
          </h2>
          <div className="w-[50px] h-[2px] bg-primary mx-auto rounded-full" />
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-6 lg:gap-8 items-start">
          {/* LEFT: Map */}
          <FadeIn>
            <div className="rounded-xl overflow-hidden border border-border shadow-card bg-card">
              <iframe
                src={MAP_EMBED}
                className="w-full h-[300px] sm:h-[380px] lg:h-[440px] border-0 block"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps - Khách sạn Tuấn Đạt Luxury"
              />
            </div>
            <Button variant="gold" size="lg" className="w-full mt-3 gap-2" asChild>
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                {isVi ? 'Xem bản đồ lớn' : 'View on Google Maps'}
              </a>
            </Button>
          </FadeIn>

          {/* RIGHT: Distances */}
          <FadeIn delay={120}>
            <div className="bg-card rounded-xl border border-border p-5 sm:p-6 space-y-1">
              <h3 className="text-base font-medium text-foreground mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                {isVi ? 'Khoảng cách di chuyển' : 'Travel distances'}
              </h3>

              <div className="divide-y divide-[#EEE]">
                {distances.map((d, i) => (
                  <div key={i} className="flex items-start gap-3 py-3">
                    <Navigation className="h-4 w-4 text-primary mt-1 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm">{d.name}</p>
                      <p className="text-sm" style={{ color: '#666' }}>{d.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="mt-4 rounded-lg p-3 flex items-start gap-2 text-sm"
                style={{ backgroundColor: '#FAF8F3', border: '0.5px solid hsl(var(--primary))' }}
              >
                <Phone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-foreground">
                  {isVi ? 'Dịch vụ đón tiễn: Liên hệ lễ tân ' : 'Pickup service: Contact reception '}
                  <a href="tel:0384418811" className="text-primary font-bold hover:underline">038.441.8811</a>
                  {isVi ? ' để đặt xe.' : ' to arrange a car.'}
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default LocationSection;
