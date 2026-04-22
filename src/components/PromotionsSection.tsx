import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useOffers } from '@/hooks/useOffers';
import { useLanguage } from '@/contexts/LanguageContext';
import FadeIn from '@/components/FadeIn';

const formatExpiry = (iso: string | null, lang: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const labels: Record<string, string> = {
    vi: 'Hết hạn', en: 'Expires', ja: '期限', zh: '截止',
  };
  return `${labels[lang] || labels.vi}: ${dd}/${mm}/${d.getFullYear()}`;
};

const PromotionsSection = () => {
  const { offers, loading } = useOffers({ featuredOnly: true, limit: 3 });
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Fallback to non-featured if there are no featured ones yet
  const { offers: anyOffers } = useOffers({ limit: 3 });
  const display = offers.length > 0 ? offers : anyOffers;

  if (loading || display.length === 0) return null;

  return (
    <section id="offers" className="py-16 sm:py-20 bg-background">
      <div className="section-container">
        {/* Header row */}
        <FadeIn className="flex items-end justify-between gap-4 mb-8 sm:mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-normal text-[#1B3A5C] tracking-tight">
            {t('offer.title')}
          </h2>
          <button
            onClick={() => navigate('/uu-dai')}
            className="inline-flex items-center gap-1.5 text-[#C9A84C] hover:text-[#b89640] text-sm font-medium hover:underline transition-colors shrink-0"
          >
            {t('promo.view_all')}
            <ArrowRight className="h-4 w-4" />
          </button>
        </FadeIn>

        {/* 3 column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {display.map((o, i) => (
            <FadeIn key={o.id} delay={i * 100}>
              <button
                onClick={() => navigate(`/uu-dai/${o.slug}`)}
                className="group block w-full text-left cursor-pointer"
              >
                <div className="overflow-hidden mb-4">
                  {o.cover_image_url ? (
                    <img
                      src={o.cover_image_url}
                      alt={o.title}
                      loading="lazy"
                      width={600}
                      height={220}
                      className="w-full h-[220px] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';
                      }}
                    />
                  ) : (
                    <div className="w-full h-[220px] bg-gradient-to-br from-primary/15 to-accent/10" />
                  )}
                </div>

                <p className="text-[11px] tracking-[1px] uppercase text-[#C9A84C] font-medium mb-2">
                  {o.category}
                </p>
                <h3 className="font-display text-lg sm:text-xl font-normal text-[#1B3A5C] leading-snug line-clamp-2 group-hover:text-[#C9A84C] transition-colors">
                  {o.title}
                </h3>
                {o.expires_at && (
                  <p className="text-xs text-[#999] mt-2">{formatExpiry(o.expires_at, language)}</p>
                )}
                <span className="inline-flex items-center gap-1 mt-3 text-[13px] text-[#C9A84C] group-hover:underline">
                  {t('room.view_detail')} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromotionsSection;
