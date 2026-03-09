import { motion } from 'framer-motion';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useLanguage } from '@/contexts/LanguageContext';

const FALLBACK_MAPS_LINK = 'https://maps.app.goo.gl/pBbcvrqXQQT4PVfn6';
const DIRECTIONS_LINK = 'https://www.google.com/maps/dir/?api=1&destination=Khách+sạn+Tuấn+Đạt+Luxury+Sầm+Sơn';
const DEFAULT_MAP_SRC = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.2167792564705!2d105.91047087504556!3d19.759731681590715!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3136515bf8afa3fd%3A0x5a29458949901908!2zS2jDoWNoIHPhuqFuIFR14bqlbiDEkOG6oXQgTHV4dXJ5IFPhuqdtIFPGoW4!5e1!3m2!1svi!2sjp!4v1772983874554!5m2!1svi!2sjp';

function extractIframeSrc(html: string): string {
  const match = html.match(/src=["']([^"']+)["']/);
  return match ? match[1] : DEFAULT_MAP_SRC;
}

const MapSection = () => {
  const { settings } = useSiteSettings();
  const { t } = useLanguage();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  const embedCode = settings.map_embed_code || '';
  const mapsLink = settings.google_maps_url || FALLBACK_MAPS_LINK;

  return (
    <section id="map" className="py-12 sm:py-16 bg-secondary">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-6 sm:mb-8"
        >
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
            <MapPin className="inline-block h-6 w-6 sm:h-7 sm:w-7 text-primary mr-2 -mt-1" />
            {isVi ? 'Vị trí khách sạn' : 'Hotel Location'}
          </h2>
          <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full mb-3" />
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            LK29-20 FLC Sầm Sơn, Thanh Hóa, Việt Nam
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <div className="rounded-2xl overflow-hidden border border-border shadow-card bg-card">
            {embedCode ? (
              <iframe
                src={extractIframeSrc(embedCode)}
                className="w-full h-[280px] sm:h-[350px] md:h-[450px] lg:h-[500px] border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps - Khách sạn Tuấn Đạt Luxury"
              />
            ) : (
              <div className="w-full h-[280px] sm:h-[350px] md:h-[450px] bg-muted flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{isVi ? 'Bản đồ đang được cập nhật' : 'Map is being updated'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Button variant="gold" size="lg" asChild>
              <a href={mapsLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                {isVi ? 'Xem trên Google Maps' : 'View on Google Maps'}
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href={DIRECTIONS_LINK} target="_blank" rel="noopener noreferrer">
                <Navigation className="h-4 w-4 mr-2" />
                {isVi ? 'Chỉ đường' : 'Get Directions'}
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MapSection;
