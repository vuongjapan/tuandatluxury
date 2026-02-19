import { Phone, Mail, MapPin, Facebook, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

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

          {/* Col 3: Address */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">{t('footer.address')}</h4>
            <div className="flex items-start gap-2 text-sm text-background/80">
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>LK29-20 FLC Sầm Sơn,<br />Thanh Hóa, Việt Nam</span>
            </div>

            {/* International Platforms */}
            <div className="mt-6">
              <p className="text-xs font-semibold text-background/60 uppercase tracking-wider mb-2">
                {t('platforms.title')}
              </p>
              <div className="flex gap-2">
                <a
                  href="https://www.booking.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs bg-background/10 hover:bg-background/20 px-3 py-1.5 rounded-full transition-colors"
                >
                  <ExternalLink className="h-3 w-3" /> Booking.com
                </a>
                <a
                  href="https://www.agoda.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs bg-background/10 hover:bg-background/20 px-3 py-1.5 rounded-full transition-colors"
                >
                  <ExternalLink className="h-3 w-3" /> Agoda
                </a>
              </div>
              <p className="text-xs text-primary mt-1">{t('platforms.direct')}</p>
            </div>
          </div>

          {/* Col 4: Map */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">{t('footer.find_us')}</h4>
            <div className="rounded-xl overflow-hidden border border-background/10">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3749.123!2d105.9!3d19.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDQ1JzAwLjAiTiAxMDXCsDU0JzAwLjAiRQ!5e0!3m2!1sen!2s!4v1"
                width="100%"
                height="180"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Hotel Location"
              />
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-background/10 text-center text-xs text-background/50">
          © {new Date().getFullYear()} Tuấn Đạt Luxury. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
