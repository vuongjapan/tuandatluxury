import { Phone, Mail, MapPin, Facebook, ExternalLink, Map } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const Footer = () => {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();

  return (
    <footer id="contact" className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Hotel Info */}
          <div>
            <h3 className="font-display text-2xl font-bold text-gold-gradient mb-4">Tuấn Đạt Luxury</h3>
            <p className="text-background/70 text-sm leading-relaxed">
              {t('footer.desc')}
            </p>
          </div>

          {/* Col 2: Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">{t('footer.contact')}</h4>
            <div className="space-y-3">
              <a href="tel:0986617939" className="flex items-center gap-2 text-sm text-background/80 hover:text-primary transition-colors">
                <Phone className="h-4 w-4 text-primary" /> 098.661.7939
              </a>
              <a href="mailto:tuandatluxury@gmail.com" className="flex items-center gap-2 text-sm text-background/80 hover:text-primary transition-colors">
                <Mail className="h-4 w-4 text-primary" /> tuandatluxury@gmail.com
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-background/80 hover:text-primary transition-colors">
                <Facebook className="h-4 w-4 text-primary" /> Facebook
              </a>
            </div>
          </div>

          {/* Col 3: Address + Platforms */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">{t('footer.address')}</h4>
            <div className="flex items-start gap-2 text-sm text-background/80">
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>LK29-20 FLC Sầm Sơn,<br />Thanh Hóa, Việt Nam</span>
            </div>

            {/* 3 Clear Buttons: Google Maps, Booking, Agoda */}
            <div className="mt-6 flex flex-col gap-2">
              






              
              <a
                href={settings.platform_booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs bg-background/10 hover:bg-background/20 px-4 py-2 rounded-full transition-colors">
                
                <ExternalLink className="h-3.5 w-3.5 text-primary" /> Đặt phòng trên {settings.platform_booking_name}
              </a>
              <a
                href={settings.platform_agoda_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs bg-background/10 hover:bg-background/20 px-4 py-2 rounded-full transition-colors">
                
                <ExternalLink className="h-3.5 w-3.5 text-primary" /> Đặt phòng trên {settings.platform_agoda_name}
              </a>
              <p className="text-xs text-primary mt-1">{t('platforms.direct')}</p>
            </div>
          </div>

          {/* Col 4: Map */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">{t('footer.find_us')}</h4>
            <div className="rounded-xl overflow-hidden border border-background/10">
            {settings.map_embed_url ?
              <iframe
                src={settings.map_embed_url}
                width="100%"
                height="180"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Hotel Location" /> :


              <a
                href={settings.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-[180px] bg-background/10 flex flex-col items-center justify-center text-xs text-background/50 hover:text-primary transition-colors gap-2">
                
                <Map className="h-8 w-8" />
                <span>Xem trên Google Maps</span>
              </a>
              }
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-background/10 text-center text-xs text-background/50">
          © {new Date().getFullYear()} Tuấn Đạt Luxury. All rights reserved.
        </div>
      </div>
    </footer>);

};

export default Footer;