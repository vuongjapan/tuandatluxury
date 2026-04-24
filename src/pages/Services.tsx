import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useServices } from '@/hooks/useServices';
import { useLanguage } from '@/contexts/LanguageContext';

const Services = () => {
  const { services, isLoading } = useServices();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isVi = t('nav.rooms') === 'Hạng phòng';
  const active = services.filter((s) => s.is_active);

  const handleClick = (link: string | null) => {
    if (!link) return;
    if (link.startsWith('http') || link.startsWith('tel:') || link.startsWith('mailto:')) {
      window.open(link, link.startsWith('http') ? '_blank' : '_self');
    } else {
      navigate(link);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="pt-32 pb-12 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-3">
            {isVi ? 'Dịch Vụ Của Chúng Tôi' : 'Our Services'}
          </h1>
          <div className="w-[50px] h-[2px] bg-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            {isVi
              ? 'Trải nghiệm trọn vẹn với hệ thống tiện ích cao cấp dành cho khách lưu trú.'
              : 'A complete experience with premium amenities for our guests.'}
          </p>
        </div>
      </section>
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Đang tải...</div>
          ) : (
            <>
              <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
                <div className="flex gap-6 pb-4 w-max">
                  {active.map((s) => (
                    <div
                      key={s.id}
                      className="snap-start shrink-0 w-[260px] sm:w-[300px] group bg-card rounded-xl overflow-hidden border border-border shadow-card hover:shadow-luxury hover:-translate-y-1 transition-all duration-500 flex flex-col"
                    >
                      <div className="relative h-[200px] overflow-hidden bg-secondary">
                        {s.image_url && (
                          <img
                            src={s.image_url}
                            alt={s.name}
                            className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
                            loading="lazy"
                          />
                        )}
                        {s.badge_text && (
                          <span
                            className={`absolute top-3 left-3 text-[11px] font-medium px-3 py-1 rounded-full ${
                              s.badge_color === 'navy'
                                ? 'bg-[#1B3A5C] text-white'
                                : 'bg-[#C9A84C] text-[#1B3A5C]'
                            }`}
                          >
                            {s.badge_text}
                          </span>
                        )}
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-display text-lg font-semibold mb-2">{s.name}</h3>
                        <p className="text-sm text-muted-foreground flex-1 line-clamp-3">{s.description}</p>
                        {s.button_text && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleClick(s.button_link)}
                            className="mt-4 self-start border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
                          >
                            {s.button_text}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">{isVi ? '← Vuốt ngang để xem thêm →' : '← Swipe to explore →'}</p>
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Services;
