import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const GOOGLE_MAPS_LINK = 'https://maps.google.com/?q=Khách+sạn+Tuấn+Đạt+Luxury+Sầm+Sơn';

const FooterMap = () => {
  const { settings } = useSiteSettings();
  const embedCode = settings.map_embed_code || '';

  return (
    <div className="space-y-3">
      <div className="rounded-lg overflow-hidden border border-background/10 bg-background/5">
        {embedCode ? (
          <div
            className="w-full aspect-square [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
            dangerouslySetInnerHTML={{ __html: embedCode }}
          />
        ) : (
          <div className="w-full aspect-square bg-background/5 flex items-center justify-center">
            <div className="text-center text-background/40">
              <MapPin className="h-8 w-8 mx-auto mb-2" />
              <p className="text-xs">Map loading...</p>
            </div>
          </div>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs border-background/20"
        asChild
      >
        <a href={GOOGLE_MAPS_LINK} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-3 w-3 mr-1" />
          Google Maps
        </a>
      </Button>
    </div>
  );
};

export default FooterMap;
