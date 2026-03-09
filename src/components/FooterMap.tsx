import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const FALLBACK_MAPS_LINK = 'https://maps.app.goo.gl/pBbcvrqXQQT4PVfn6';
const FALLBACK_DIRECTIONS_LINK = 'https://www.google.com/maps/dir/?api=1&destination=Khách+sạn+Tuấn+Đạt+Luxury+Sầm+Sơn';
const DEFAULT_MAP_SRC = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.2167792564705!2d105.91047087504556!3d19.759731681590715!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3136515bf8afa3fd%3A0x5a29458949901908!2zS2jDoWNoIHPhuqFuIFR14bqlbiDEkOG6oXQgTHV4dXJ5IFPhuqdtIFPGoW4!5e1!3m2!1svi!2sjp!4v1772983874554!5m2!1svi!2sjp';

function extractIframeSrc(html: string): string {
  const match = html.match(/src=["']([^"']+)["']/);
  return match ? match[1] : DEFAULT_MAP_SRC;
}

const FooterMap = () => {
  const { settings } = useSiteSettings();
  const embedCode = settings.map_embed_code || '';
  const mapsLink = settings.google_maps_url || FALLBACK_MAPS_LINK;

  return (
    <div className="space-y-2">
      <div className="rounded-lg overflow-hidden border border-background/10 bg-background/5">
        {embedCode ? (
          <iframe
            src={extractIframeSrc(embedCode)}
            className="w-full h-[180px] border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Maps"
          />
        ) : (
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-[180px] flex flex-col items-center justify-center text-background/40 hover:text-primary transition-colors"
          >
            <MapPin className="h-8 w-8 mb-2" />
            <p className="text-xs">Xem bản đồ</p>
          </a>
        )}
      </div>
      <div className="flex gap-2">
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-background/10 hover:bg-background/20 px-3 py-2 rounded-full transition-colors text-background/80 hover:text-primary"
        >
          <ExternalLink className="h-3 w-3" />
          Bản đồ
        </a>
        <a
          href={FALLBACK_DIRECTIONS_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-primary/20 hover:bg-primary/30 px-3 py-2 rounded-full transition-colors text-primary"
        >
          <Navigation className="h-3 w-3" />
          Chỉ đường
        </a>
      </div>
    </div>
  );
};

export default FooterMap;
