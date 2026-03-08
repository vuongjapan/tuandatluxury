import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const GOOGLE_MAPS_LINK = 'https://www.google.com/maps/place/Kh%C3%A1ch+s%E1%BA%A1n+Tu%E1%BA%A5n+%C4%90%E1%BA%A1t+Luxury+S%E1%BA%A7m+S%C6%A1n';
const DIRECTIONS_LINK = 'https://www.google.com/maps/dir/?api=1&destination=Khách+sạn+Tuấn+Đạt+Luxury+Sầm+Sơn';

const FooterMap = () => {
  const { settings } = useSiteSettings();
  const embedCode = settings.map_embed_code || '';

  return (
    <div className="space-y-2">
      <div className="rounded-lg overflow-hidden border border-background/10 bg-background/5">
        {embedCode ? (
          <div
            className="w-full h-[180px] [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
            dangerouslySetInnerHTML={{ __html: embedCode }}
          />
        ) : (
          <a
            href={GOOGLE_MAPS_LINK}
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
          href={GOOGLE_MAPS_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-background/10 hover:bg-background/20 px-3 py-2 rounded-full transition-colors text-background/80 hover:text-primary"
        >
          <ExternalLink className="h-3 w-3" />
          Bản đồ
        </a>
        <a
          href={DIRECTIONS_LINK}
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
