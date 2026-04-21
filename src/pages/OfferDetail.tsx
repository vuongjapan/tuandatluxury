import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar, Tag } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useOffer, useOffers } from '@/hooks/useOffers';
import { useLanguage } from '@/contexts/LanguageContext';

const formatDate = (iso: string | null, isVi: boolean) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};

const OfferDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { offer, loading } = useOffer(slug);
  const { offers: related } = useOffers({ limit: 4 });
  const { t } = useLanguage();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="animate-pulse h-8 bg-muted w-48 mb-6" />
          <div className="animate-pulse h-[400px] bg-muted mb-6" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-2xl text-foreground mb-4">
            {isVi ? 'Không tìm thấy ưu đãi' : 'Offer not found'}
          </h1>
          <Button variant="gold" onClick={() => navigate('/uu-dai')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isVi ? 'Quay lại tất cả ưu đãi' : 'Back to all offers'}
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const relatedFiltered = related.filter(r => r.id !== offer.id).slice(0, 3);
  const conditions = (offer.conditions || '')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero image */}
      {offer.cover_image_url && (
        <div className="w-full h-[300px] sm:h-[400px] overflow-hidden">
          <img
            src={offer.cover_image_url}
            alt={offer.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="container mx-auto px-4 py-10 sm:py-14">
        <button
          onClick={() => navigate('/uu-dai')}
          className="inline-flex items-center gap-1.5 text-[#C9A84C] hover:underline text-sm mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {isVi ? 'Tất cả ưu đãi' : 'All offers'}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <article className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1 text-[11px] tracking-[1px] uppercase text-[#C9A84C] border border-[#C9A84C]/40 rounded-full px-3 py-1">
                <Tag className="h-3 w-3" /> {offer.category}
              </span>
              {offer.expires_at && (
                <span className="inline-flex items-center gap-1 text-xs text-[#999]">
                  <Calendar className="h-3.5 w-3.5" />
                  {isVi ? 'Hết hạn' : 'Expires'}: {formatDate(offer.expires_at, isVi)}
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl text-[#1B3A5C] font-normal mb-4 leading-tight">
              {offer.title}
            </h1>

            {offer.summary && (
              <p className="text-base text-[#555] leading-relaxed mb-8 italic">
                {offer.summary}
              </p>
            )}

            <div
              className="prose prose-sm sm:prose-base max-w-none prose-headings:font-display prose-headings:text-[#1B3A5C] prose-a:text-[#C9A84C]"
              dangerouslySetInnerHTML={{ __html: offer.content || '' }}
            />

            {conditions.length > 0 && (
              <div className="mt-10 p-5 bg-secondary rounded-lg">
                <h3 className="font-display text-lg text-[#1B3A5C] mb-3">
                  {isVi ? 'Điều kiện áp dụng' : 'Terms & conditions'}
                </h3>
                <ul className="space-y-1.5 text-sm text-[#555]">
                  {conditions.map((c, i) => (
                    <li key={i} className="flex gap-2"><span className="text-[#C9A84C]">•</span><span>{c}</span></li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-10">
              <Button
                variant="gold"
                size="lg"
                onClick={() => navigate(`/booking?offer=${offer.slug}`)}
              >
                {isVi ? 'Đặt phòng với ưu đãi này' : 'Book with this offer'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </article>

          {/* Sidebar - related */}
          <aside>
            <h3 className="font-display text-lg text-[#1B3A5C] mb-4 pb-3 border-b border-border">
              {isVi ? 'Ưu đãi khác' : 'More offers'}
            </h3>
            <div className="space-y-5">
              {relatedFiltered.map(r => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/uu-dai/${r.slug}`)}
                  className="group flex gap-3 w-full text-left"
                >
                  {r.cover_image_url ? (
                    <img
                      src={r.cover_image_url}
                      alt={r.title}
                      className="w-24 h-20 object-cover shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-24 h-20 bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] tracking-[1px] uppercase text-[#C9A84C] mb-1">{r.category}</p>
                    <h4 className="text-sm text-[#1B3A5C] font-medium line-clamp-2 leading-snug group-hover:text-[#C9A84C] transition-colors">
                      {r.title}
                    </h4>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OfferDetail;
