import { motion } from 'framer-motion';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useLanguage } from '@/contexts/LanguageContext';

const GOOGLE_MAPS_LINK = 'https://maps.google.com/?q=Khách+sạn+Tuấn+Đạt+Luxury+Sầm+Sơn';

const DEFAULT_MAP_SRC = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.2167792564705!2d105.91047087504556!3d19.759731681590715!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3136515bf8afa3fd%3A0x5a29458949901908!2zS2jDoWNoIHPhuqFuIFR14bqlbiDEkOG6oXQgTHV4dXJ5IFPhuqdtIFPGoW4!5e1!3m2!1svi!2sjp!4v1772983874554!5m2!1svi!2sjp';

function extractIframeSrc(html: string): string {
  const match = html.match(/src=["']([^"']+)["']/);
  return match ? match[1] : DEFAULT_MAP_SRC;
}

const MapSection = () => {
  const { settings, loading } = useSiteSettings();
  const { t } = useLanguage();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  const embedCode = settings.map_embed_code || '';

  return (
    <section id="map" className="py-16 bg-secondary">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
            <MapPin className="inline-block h-7 w-7 text-primary mr-2 -mt-1" />
            {isVi ? 'Vị trí khách sạn' : 'Hotel Location'}
          </h2>
          <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full mb-4" />
          <p className="text-muted-foreground max-w-lg mx-auto">
            LK29-20 FLC Sầm Sơn, Thanh Hóa, Việt Nam
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="rounded-2xl overflow-hidden border border-border shadow-card bg-card">
            {embedCode ? (
              <iframe
                src={extractIframeSrc(embedCode)}
                className="w-full aspect-video border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps - Khách sạn Tuấn Đạt Luxury"
              />
            ) : (
              <div className="w-full aspect-video bg-muted flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{isVi ? 'Bản đồ đang được cập nhật' : 'Map is being updated'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-6">
            <Button
              variant="gold"
              size="lg"
              asChild
            >
              <a href={GOOGLE_MAPS_LINK} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                {isVi ? 'Xem trên Google Maps' : 'View on Google Maps'}
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MapSection;
