import { Phone, Mail, MapPin, Facebook, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import FooterMap from '@/components/FooterMap';

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

            <div className="mt-6 flex flex-col gap-2">
              <a
                href="https://www.booking.com/hotel/vn/tuan-dat-luxury-flc-sam-son-sam-son.vi.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs bg-background/10 hover:bg-background/20 px-4 py-2 rounded-full transition-colors">
                <ExternalLink className="h-3.5 w-3.5 text-primary" /> Đặt phòng trên Booking.com
              </a>
              <a
                href="https://www.agoda.com/vi-vn/tuan-dat-luxury-hotel-flc/hotel/thanh-hoa-sam-son-beach-vn.html?cid=1844104&ds=eOSBCifZS4w0QBRo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs bg-background/10 hover:bg-background/20 px-4 py-2 rounded-full transition-colors">
                <ExternalLink className="h-3.5 w-3.5 text-primary" /> Đặt phòng trên Agoda
              </a>
              <a
                href="https://www.traveloka.com/vi-vn/hotel/vietnam/tuan-dat-luxury-hotel-flc-9000000987051"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs bg-background/10 hover:bg-background/20 px-4 py-2 rounded-full transition-colors">
                <ExternalLink className="h-3.5 w-3.5 text-primary" /> Đặt phòng trên Traveloka
              </a>
              <a
                href="https://vn.trip.com/hotels/sam-son-hotel-detail-79078975/tuan-dat-luxury-hotel-flc/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs bg-background/10 hover:bg-background/20 px-4 py-2 rounded-full transition-colors">
                <ExternalLink className="h-3.5 w-3.5 text-primary" /> Đặt phòng trên Trip.com
              </a>
              <p className="text-xs text-primary mt-1">{t('platforms.direct')}</p>
            </div>
          </div>

          {/* Col 4: Map */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">{t('footer.find_us')}</h4>
            <FooterMap />
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