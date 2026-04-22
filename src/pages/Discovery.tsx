import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FadeIn from '@/components/FadeIn';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAttractions } from '@/hooks/useAttractions';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const Discovery = () => {
  const { t } = useLanguage();
  const { attractions } = useAttractions();
  const { settings } = useSiteSettings();
  const isVi = t('nav.rooms') === 'Hạng phòng';
  const list = Array.isArray(attractions) ? attractions : [];

  const mapEmbed = settings.map_embed_url || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3741.9!2d105.91!3d19.74!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDQ0JzI0LjAiTiAxMDXCsDU0JzM2LjAiRQ!5e0!3m2!1sen!2s!4v1700000000000';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-12 pb-10 bg-gradient-to-b from-foreground to-foreground/90 text-background">
        <div className="container mx-auto px-4 text-center">
          <FadeIn>
            <p className="text-primary font-display text-xs tracking-[0.4em] uppercase mb-3">
              {isVi ? 'Khám phá' : 'Discover'}
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold mb-4">
              {isVi ? 'Khám phá Sầm Sơn' : 'Explore Sầm Sơn'}
            </h1>
            <p className="text-sm sm:text-base text-background/70 max-w-2xl mx-auto">
              {isVi ? 'Những điểm đến không thể bỏ lỡ quanh khu vực FLC Sầm Sơn' : 'Must-visit spots around FLC Sầm Sơn area'}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Interactive map */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <FadeIn>
            <div className="rounded-2xl overflow-hidden shadow-luxury border border-border aspect-[16/9] bg-muted">
              <iframe
                src={mapEmbed}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Map"
              />
            </div>
            <div className="text-center mt-4">
              <Button variant="outline" size="sm" asChild>
                <a href={settings.google_maps_url} target="_blank" rel="noopener noreferrer">
                  <Navigation className="h-4 w-4" /> {isVi ? 'Mở Google Maps' : 'Open in Google Maps'}
                </a>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Nearby places */}
      <section className="py-12 bg-secondary">
        <div className="container mx-auto px-4 max-w-6xl">
          <FadeIn className="text-center mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold">
              {isVi ? 'Điểm tham quan lân cận' : 'Nearby Attractions'}
            </h2>
          </FadeIn>

          <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            <div className="flex gap-5 pb-4">
              {list.map((place, i) => (
                <FadeIn key={place.id} delay={i * 60} className="snap-start shrink-0 w-[280px] sm:w-[320px]">
                  <div className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-luxury hover:-translate-y-1 transition-all duration-500 group h-full flex flex-col">
                    {place.image_url ? (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={place.image_url}
                          alt={isVi ? place.name_vi : place.name_en}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted flex items-center justify-center text-5xl">{place.icon}</div>
                    )}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-display font-semibold text-base">{isVi ? place.name_vi : place.name_en}</h3>
                        <span className="text-xs text-primary font-medium flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {place.distance}
                        </span>
                      </div>
                      {(isVi ? place.description_vi : place.description_en) && (
                        <p className="text-xs text-muted-foreground leading-relaxed flex-1 line-clamp-3">
                          {isVi ? place.description_vi : place.description_en}
                        </p>
                      )}
                      <Button variant="outline" size="sm" className="mt-4 w-full gap-2" asChild>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((isVi ? place.name_vi : place.name_en) + ' Sầm Sơn')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3" /> {isVi ? 'Xem đường đi' : 'Get directions'}
                        </a>
                      </Button>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">{isVi ? '← Vuốt ngang để xem thêm →' : '← Swipe to explore →'}</p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Discovery;
