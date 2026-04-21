import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FadeIn from '@/components/FadeIn';
import { useOffers } from '@/hooks/useOffers';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const formatExpiry = (iso: string | null, isVi: boolean) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return isVi ? `Hết hạn ${dd}/${mm}/${d.getFullYear()}` : `Expires ${dd}/${mm}/${d.getFullYear()}`;
};

const Offers = () => {
  const { offers, loading } = useOffers();
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  const heroImage =
    (settings as any)?.offers_hero_url ||
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600&q=80';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Banner */}
      <section
        className="relative w-full h-[280px] flex items-end"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[#1B3A5C]/55" />
        <div className="relative z-10 container mx-auto px-6 sm:px-10 pb-10">
          <p className="text-[#C9A84C] text-[11px] sm:text-xs tracking-[3px] uppercase mb-3 font-medium">
            {isVi ? 'ƯU ĐÃI ĐẶC QUYỀN' : 'EXCLUSIVE OFFERS'}
          </p>
          <h1 className="font-display text-3xl sm:text-5xl text-white font-normal mb-3">
            {isVi ? 'Ưu Đãi' : 'Offers'}
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-xl">
            {isVi
              ? 'Những ưu đãi hấp dẫn dành riêng cho quý khách'
              : 'Exclusive promotions curated just for you'}
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-[240px] bg-muted mb-3" />
                  <div className="h-4 bg-muted w-1/3 mb-2" />
                  <div className="h-5 bg-muted w-2/3 mb-1" />
                  <div className="h-3 bg-muted w-full" />
                </div>
              ))}
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">
                {isVi ? 'Chưa có ưu đãi nào.' : 'No offers available yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {offers.map((o, i) => (
                <FadeIn key={o.id} delay={i * 60}>
                  <button
                    onClick={() => navigate(`/uu-dai/${o.slug}`)}
                    className="group block w-full text-left cursor-pointer"
                  >
                    <div className="overflow-hidden mb-3">
                      {o.cover_image_url ? (
                        <img
                          src={o.cover_image_url}
                          alt={o.title}
                          loading="lazy"
                          width={600}
                          height={240}
                          className="w-full h-[240px] object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-full h-[240px] bg-gradient-to-br from-primary/15 to-accent/10" />
                      )}
                    </div>

                    <div className="py-2">
                      <span className="inline-block text-[11px] tracking-[1px] uppercase text-[#C9A84C] border border-[#C9A84C]/40 rounded-full px-2.5 py-0.5">
                        {o.category}
                      </span>
                      <h3 className="font-display text-xl text-[#1B3A5C] font-normal leading-tight my-2 group-hover:text-[#C9A84C] transition-colors">
                        {o.title}
                      </h3>
                      {o.summary && (
                        <p className="text-sm text-[#666] line-clamp-2 leading-relaxed">{o.summary}</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        {o.expires_at ? (
                          <span className="text-xs text-[#999]">{formatExpiry(o.expires_at, isVi)}</span>
                        ) : <span />}
                        <span className="inline-flex items-center gap-1 text-[13px] text-[#C9A84C] group-hover:underline">
                          {isVi ? 'Xem chi tiết' : 'Read more'} <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </button>
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Offers;
