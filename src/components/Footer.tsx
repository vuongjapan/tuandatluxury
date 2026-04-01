import { Phone, Mail, MapPin, Facebook, ExternalLink, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const Footer = () => {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  return (
    <footer id="contact" className="bg-foreground text-background">
      {/* Newsletter / CTA band */}
      <div className="bg-primary/10 border-b border-background/10">
        <div className="container mx-auto px-4 py-8 sm:py-10 text-center">
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground mb-2">
            {isVi ? 'Đặt phòng ngay hôm nay' : 'Book Your Stay Today'}
          </h3>
          <p className="text-background/70 text-sm sm:text-base mb-4 max-w-xl mx-auto">
            {isVi ?
            'Liên hệ trực tiếp để nhận giá tốt nhất và các ưu đãi độc quyền dành riêng cho bạn.' :
            'Contact us directly for the best rates and exclusive offers just for you.'}
          </p>
          <a
            href="tel:0986617939"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity">
            
            <Phone className="h-4 w-4" /> 098.661.7939
          </a>
          </a>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Col 1: Hotel Info */}
          <div className="md:col-span-1">
            <h3 className="font-display text-2xl font-bold text-gold-gradient mb-3">Tuấn Đạt Luxury</h3>
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />)}
            </div>
            <p className="text-background/60 text-sm leading-relaxed">
              {t('footer.desc')}
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="font-display text-base font-semibold mb-4 text-primary">
              {isVi ? 'Khám phá' : 'Explore'}
            </h4>
            <div className="space-y-2">
              {[
              { label: isVi ? 'Hạng phòng' : 'Rooms', href: '/#rooms' },
              { label: isVi ? 'Ẩm thực' : 'Dining', href: '/dining' },
              { label: isVi ? 'Dịch vụ' : 'Services', href: '/#services' },
              { label: isVi ? 'Thư viện ảnh' : 'Gallery', href: '/#gallery' },
              { label: isVi ? 'Ưu đãi' : 'Offers', href: '/#offers' }].
              map((link) =>
              <a key={link.href} href={link.href} className="block text-sm text-background/60 hover:text-primary transition-colors">
                  {link.label}
                </a>
              )}
            </div>
          </div>

          {/* Col 3: Contact */}
          <div>
            <h4 className="font-display text-base font-semibold mb-4 text-primary">{t('footer.contact')}</h4>
            <div className="space-y-3">
              <a href="tel:0983607568" className="flex items-center gap-2 text-sm text-background/70 hover:text-primary transition-colors">
                <Phone className="h-4 w-4 text-primary shrink-0" /> 098.360.7568
              </a>
              <a href="tel:0369845422" className="flex items-center gap-2 text-sm text-background/70 hover:text-primary transition-colors">
                <Phone className="h-4 w-4 text-primary shrink-0" /> 036.984.5422
              </a>
              <a href="tel:0986617939" className="flex items-center gap-2 text-sm text-background/70 hover:text-primary transition-colors">
                <Phone className="h-4 w-4 text-primary shrink-0" /> 098.661.7939
              </a>
              <a className="flex items-center gap-2 text-sm text-background/70 hover:text-primary transition-colors" href="mailto:tuandatluxuryflc36hotel@gmail.com">
                <Mail className="h-4 w-4 text-primary shrink-0" /> tuandatluxuryflc36hotel@gmail.com
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-background/70 hover:text-primary transition-colors">
                <Facebook className="h-4 w-4 text-primary shrink-0" /> Facebook
              </a>
              <div className="flex items-start gap-2 text-sm text-background/70">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>LK29-20 cạnh cổng FLC Sầm Sơn,Thanh Hóa, Việt Nam
                  <br />Thanh Hóa, Việt Nam</span>
              </div>
            </div>
          </div>

          {/* Col 4: OTA Platforms */}
          <div>
            <h4 className="font-display text-base font-semibold mb-4 text-primary">
              {isVi ? 'Đặt phòng qua' : 'Book via'}
            </h4>
            <div className="flex flex-col gap-2">
              {[{ name: 'Booking.com', url: 'https://www.booking.com/hotel/vn/tuan-dat-luxury-flc-sam-son-sam-son.vi.html' },
              { name: 'Agoda', url: 'https://www.agoda.com/vi-vn/tuan-dat-luxury-hotel-flc/hotel/thanh-hoa-sam-son-beach-vn.html?cid=1844104&ds=eOSBCifZS4w0QBRo' },
              { name: 'Traveloka', url: 'https://www.traveloka.com/vi-vn/hotel/vietnam/tuan-dat-luxury-hotel-flc-9000000987051' },
              { name: 'Trip.com', url: 'https://vn.trip.com/hotels/sam-son-hotel-detail-79078975/tuan-dat-luxury-hotel-flc/' }].
              map((ota) =>
              <a
                key={ota.name}
                href={ota.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs bg-background/5 hover:bg-background/10 px-3 py-2 rounded-lg transition-colors text-background/70 hover:text-primary">
                
                  <ExternalLink className="h-3.5 w-3.5 text-primary shrink-0" /> {ota.name}
                </a>
              )}
              <p className="text-xs text-primary mt-1">{t('platforms.direct')}</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-background/10 flex-col sm:flex-row gap-3 flex items-start justify-between">
          <p className="text-xs text-background/40">
            © {new Date().getFullYear()} Tuấn Đạt Luxury Hotel. All rights reserved.
          </p>
          <p className="text-xs text-background/40">
            {isVi ? 'FLC Sầm Sơn, Thanh Hóa, Việt Nam' : 'FLC Sầm Sơn, Thanh Hóa, Vietnam'}
          </p>
        </div>
      </div>
    </footer>);

};

export default Footer;