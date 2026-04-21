import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePromotions } from '@/hooks/usePromotions';
import { useAuth, MemberTier, TIER_COLORS } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, LogIn, Crown, Star, Users, ArrowRight } from 'lucide-react';

const TIER_DISCOUNT: Record<MemberTier, number> = {
  normal: 5,
  vip: 10,
  super_vip: 15,
};

const PROMO_TYPE_BADGE: Record<string, { vi: string; en: string; cls: string }> = {
  seasonal: { vi: 'Theo mùa', en: 'Seasonal', cls: 'bg-rose-500/90 text-white' },
  member: { vi: 'Thành viên', en: 'Member', cls: 'bg-amber-500/90 text-white' },
  couple: { vi: 'Cặp đôi', en: 'Couple', cls: 'bg-pink-500/90 text-white' },
  group: { vi: 'Đoàn', en: 'Group', cls: 'bg-blue-600/90 text-white' },
};

const PromotionsSection = () => {
  const { promotions, loading } = usePromotions();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const isVi = t('nav.rooms') === 'Hạng phòng';
  const activePromotions = promotions.filter(p => p.is_active);

  if (loading || activePromotions.length === 0) return null;

  const getUserDiscount = (promo: typeof activePromotions[0]) => {
    if (!user) return null;
    if (promo.applies_to_tier === 'member') return TIER_DISCOUNT[user.tier];
    if (promo.discount_percent > 0) return promo.discount_percent + (TIER_DISCOUNT[user.tier] || 0);
    return TIER_DISCOUNT[user.tier] > 0 ? TIER_DISCOUNT[user.tier] : null;
  };

  const handleBookNow = (promo: typeof activePromotions[0]) => {
    const promoType = (promo as any).promo_type || 'seasonal';
    navigate(`/booking?promo=${promo.id}&promo_type=${promoType}`);
  };

  return (
    <section id="offers" className="py-20 sm:py-24 bg-secondary">
      <div className="container mx-auto px-4">
        {/* [1] Login Banner — full-width navy gradient */}
        {!user ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-12 rounded-xl overflow-hidden shadow-luxury"
            style={{ background: 'linear-gradient(90deg, #1B3A5C 0%, #0D2137 100%)' }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-5 md:px-8 py-5 md:py-0 md:h-[100px]">
              {/* Left */}
              <div className="flex items-center gap-3 text-white text-center md:text-left">
                <div className="w-10 h-10 rounded-full bg-[#C9A84C]/20 flex items-center justify-center shrink-0">
                  <LogIn className="h-5 w-5 text-[#C9A84C]" />
                </div>
                <p className="font-medium text-sm sm:text-base">
                  {isVi ? 'Đăng nhập để nhận ưu đãi độc quyền' : 'Sign in for exclusive offers'}
                </p>
              </div>

              {/* Middle - Tier badges */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="inline-flex items-center gap-1 border border-white/40 text-white text-[11px] sm:text-xs px-3 py-1 rounded-full">
                  <Users className="h-3 w-3" /> {isVi ? 'Thường 5%' : 'Member 5%'}
                </span>
                <span className="inline-flex items-center gap-1 border border-[#C9A84C] text-[#C9A84C] text-[11px] sm:text-xs px-3 py-1 rounded-full">
                  <Star className="h-3 w-3" /> VIP 10%
                </span>
                <span className="inline-flex items-center gap-1 border border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C] text-[11px] sm:text-xs px-3 py-1 rounded-full">
                  <Crown className="h-3 w-3" /> {isVi ? 'Siêu VIP 15%' : 'Super VIP 15%'}
                </span>
              </div>

              {/* Right - CTA */}
              <button
                onClick={() => navigate('/member')}
                className="shrink-0 bg-[#C9A84C] hover:bg-[#b89640] text-[#1B3A5C] font-bold text-sm px-5 py-2.5 rounded-full transition-colors duration-200 whitespace-nowrap"
              >
                {isVi ? 'Đăng nhập / Đăng ký' : 'Sign in / Register'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-12 bg-card rounded-xl border border-border p-5 text-center shadow-card max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              {user.tier === 'super_vip' ? <Crown className="h-5 w-5 text-amber-600" /> : user.tier === 'vip' ? <Star className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-muted-foreground" />}
              <h3 className="font-display text-lg font-semibold text-foreground">
                {isVi ? `Xin chào, ${user.fullName}!` : `Welcome, ${user.fullName}!`}
              </h3>
            </div>
            <Badge className={`${TIER_COLORS[user.tier]} text-sm px-4 py-1`}>
              {isVi
                ? `Hạng ${user.tier === 'super_vip' ? 'Siêu VIP' : user.tier === 'vip' ? 'VIP' : 'Thành viên'} — Giảm ${TIER_DISCOUNT[user.tier]}% tự động`
                : `${user.tier.replace('_', ' ').toUpperCase()} — ${TIER_DISCOUNT[user.tier]}% off auto`}
            </Badge>
          </motion.div>
        )}

        {/* [2] Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-[#C9A84C] font-medium text-xs tracking-[0.3em] uppercase mb-3">
            {isVi ? 'ƯU ĐÃI' : 'OFFERS'}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-4 tracking-tight">
            {isVi ? 'Ưu Đãi & Khuyến Mãi' : 'Offers & Promotions'}
          </h2>
          <div className="w-[50px] h-[2px] bg-[#C9A84C] mx-auto mb-4" />
          <p className="text-muted-foreground text-[15px] max-w-xl mx-auto leading-relaxed">
            {isVi
              ? 'Trải nghiệm nghỉ dưỡng sang trọng với những ưu đãi hấp dẫn dành riêng cho bạn'
              : 'Experience luxury stays with exclusive offers just for you'}
          </p>
        </motion.div>

        {/* [3] 4 Promo Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {activePromotions.slice(0, 4).map((promo, i) => {
            const discount = getUserDiscount(promo);
            const promoType = (promo as any).promo_type || 'seasonal';
            const typeBadge = PROMO_TYPE_BADGE[promoType] || PROMO_TYPE_BADGE.seasonal;
            const isHot = i === 0;
            const isNew = i === 1;

            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group relative bg-card rounded-xl overflow-hidden border border-border shadow-card hover:-translate-y-1 transition-all duration-300 flex flex-col"
                style={{ boxShadow: '0 2px 8px rgba(27,58,92,0.06)' }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 12px 28px rgba(27,58,92,0.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(27,58,92,0.06)')}
              >
                {/* Image */}
                <div className="relative h-[200px] overflow-hidden">
                  {promo.image_url ? (
                    <img
                      src={promo.image_url}
                      alt={isVi ? promo.title_vi : promo.title_en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      width={400}
                      height={200}
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'; }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/15 to-accent/5 flex items-center justify-center">
                      <span className="text-6xl">{promo.icon}</span>
                    </div>
                  )}
                  {/* gradient bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />

                  {/* Type badge top-left */}
                  <span className={`absolute top-3 left-3 ${typeBadge.cls} text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur`}>
                    {isVi ? typeBadge.vi : typeBadge.en}
                  </span>

                  {/* HOT / NEW / discount top-right */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                    {user && discount && discount > 0 && (
                      <span className="bg-[#C9A84C] text-[#1B3A5C] text-xs font-bold px-2.5 py-1 rounded-full shadow">
                        -{discount}%
                      </span>
                    )}
                    {isHot && (
                      <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider">
                        HOT
                      </span>
                    )}
                    {isNew && (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider">
                        {isVi ? 'MỚI' : 'NEW'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-display text-lg font-medium text-[#1B3A5C] mb-3 leading-snug">
                    {isVi ? promo.title_vi : promo.title_en}
                  </h3>

                  <ul className="space-y-2 mb-4 flex-1">
                    {(isVi ? promo.benefits_vi : promo.benefits_en).slice(0, 4).map((b, j) => (
                      <li key={j} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{b}</span>
                      </li>
                    ))}
                  </ul>

                  {promo.discount_percent > 0 && (
                    <div className="mb-3">
                      <span className="font-display text-2xl font-bold text-[#C9A84C]">
                        -{promo.discount_percent}%
                      </span>
                    </div>
                  )}

                  <Button
                    onClick={() => handleBookNow(promo)}
                    className="w-full bg-[#C9A84C] hover:bg-[#b89640] text-[#1B3A5C] font-semibold"
                  >
                    {isVi ? 'Đặt phòng ngay' : 'Book Now'}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* [4] CTA bottom */}
        <div className="text-center mt-10">
          <button
            onClick={() => navigate('/khuyen-mai')}
            className="inline-flex items-center gap-1.5 text-[#C9A84C] hover:text-[#b89640] text-sm font-medium hover:underline transition-colors"
          >
            {isVi ? 'Xem tất cả ưu đãi' : 'View all offers'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default PromotionsSection;
