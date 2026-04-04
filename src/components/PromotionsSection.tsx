import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePromotions } from '@/hooks/usePromotions';
import { useAuth, MemberTier, TIER_LABELS, TIER_COLORS } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, LogIn, Crown, Star, Users } from 'lucide-react';

const TIER_DISCOUNT: Record<MemberTier, number> = {
  normal: 5,
  vip: 10,
  super_vip: 15,
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
    if (promo.applies_to_tier === 'member') {
      return TIER_DISCOUNT[user.tier];
    }
    if (promo.discount_percent > 0) {
      const tierBonus = TIER_DISCOUNT[user.tier] || 0;
      return promo.discount_percent + tierBonus;
    }
    return TIER_DISCOUNT[user.tier] > 0 ? TIER_DISCOUNT[user.tier] : null;
  };

  const handleBookNow = (promo: typeof activePromotions[0]) => {
    const promoType = (promo as any).promo_type || 'seasonal';
    navigate(`/booking?promo=${promo.id}&promo_type=${promoType}`);
  };

  return (
    <section id="offers" className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        {/* Login/Register CTA at top */}
        {!user ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 text-center shadow-card max-w-2xl mx-auto">
              <LogIn className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {isVi ? 'Đăng nhập để nhận ưu đãi độc quyền' : 'Sign in for exclusive discounts'}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {isVi
                  ? 'Hệ thống tự động nhận diện hạng thành viên và áp dụng giảm giá: Thường 5% • VIP 10% • Siêu VIP 15%'
                  : 'Auto-detect member tier & apply discounts: Member 5% • VIP 10% • Super VIP 15%'}
              </p>
              <div className="flex items-center justify-center gap-3 mb-4">
                <Badge className="bg-muted text-muted-foreground text-xs"><Users className="h-3 w-3 mr-1" /> {isVi ? 'Thường 5%' : 'Member 5%'}</Badge>
                <Badge className="bg-primary/20 text-primary text-xs"><Star className="h-3 w-3 mr-1" /> VIP 10%</Badge>
                <Badge className="bg-amber-100 text-amber-800 text-xs"><Crown className="h-3 w-3 mr-1" /> {isVi ? 'Siêu VIP 15%' : 'Super VIP 15%'}</Badge>
              </div>
              <Button variant="gold" size="lg" onClick={() => navigate('/member')}>
                <LogIn className="h-4 w-4 mr-2" />
                {isVi ? 'Đăng nhập / Đăng ký ngay' : 'Sign in / Register now'}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <div className="bg-card rounded-2xl border border-border p-6 text-center shadow-card max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-2">
                {user.tier === 'super_vip' ? <Crown className="h-6 w-6 text-amber-600" /> : user.tier === 'vip' ? <Star className="h-6 w-6 text-primary" /> : <Users className="h-6 w-6 text-muted-foreground" />}
                <h3 className="font-display text-xl font-bold text-foreground">
                  {isVi ? `Xin chào, ${user.fullName}!` : `Welcome, ${user.fullName}!`}
                </h3>
              </div>
              <Badge className={`${TIER_COLORS[user.tier]} text-sm px-4 py-1 mb-2`}>
                {isVi 
                  ? `Hạng ${user.tier === 'super_vip' ? 'Siêu VIP' : user.tier === 'vip' ? 'VIP' : 'Thành viên'} — Giảm ${TIER_DISCOUNT[user.tier]}%`
                  : `${user.tier.replace('_', ' ').toUpperCase()} — ${TIER_DISCOUNT[user.tier]}% off`}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                {isVi
                  ? `Bạn đã đặt ${user.bookingCount} lần. Ưu đãi ${TIER_DISCOUNT[user.tier]}% được áp dụng tự động vào mọi đơn đặt phòng.`
                  : `You have ${user.bookingCount} bookings. ${TIER_DISCOUNT[user.tier]}% discount applied automatically.`}
              </p>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl font-bold text-foreground mb-3">
            {isVi ? 'Ưu đãi & Khuyến mãi' : 'Offers & Promotions'}
          </h2>
          <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full mb-4" />
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {isVi
              ? 'Trải nghiệm nghỉ dưỡng sang trọng với những ưu đãi hấp dẫn dành riêng cho bạn'
              : 'Experience luxury stays with exclusive offers just for you'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activePromotions.map((promo, i) => {
            const discount = getUserDiscount(promo);
            const promoType = (promo as any).promo_type || 'seasonal';
            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group relative bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
              >
                {promo.image_url ? (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={promo.image_url}
                      alt={isVi ? promo.title_vi : promo.title_en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                    />
                    <div className="absolute inset-0 h-40 bg-gradient-to-t from-card/80 to-transparent" />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent flex items-center justify-center">
                    <span className="text-5xl">{promo.icon}</span>
                  </div>
                )}

                {user && discount && discount > 0 && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className="bg-gold-gradient text-primary-foreground font-bold shadow-gold text-sm px-3 py-1">
                      -{discount}%
                    </Badge>
                  </div>
                )}

                {/* Promo type badge */}
                <div className="absolute top-3 left-3 z-10">
                  <Badge variant="outline" className="bg-card/80 backdrop-blur text-xs">
                    {promoType === 'group' ? (isVi ? '👥 Đoàn/Công ty' : '👥 Group') :
                     promoType === 'couple' ? (isVi ? '💑 Cặp đôi' : '💑 Couple') :
                     promoType === 'member' ? (isVi ? '⭐ Thành viên' : '⭐ Member') :
                     (isVi ? '🌸 Theo mùa' : '🌸 Seasonal')}
                  </Badge>
                </div>

                <div className="p-6">
                  {promo.image_url && (
                    <span className="text-3xl mb-2 block">{promo.icon}</span>
                  )}
                  <h3 className="font-display text-xl font-bold text-foreground mb-3">
                    {isVi ? promo.title_vi : promo.title_en}
                  </h3>

                  <ul className="space-y-2 mb-6">
                    {(isVi ? promo.benefits_vi : promo.benefits_en).map((b, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant="gold"
                    className="w-full"
                    onClick={() => handleBookNow(promo)}
                  >
                    {isVi ? 'Đặt phòng ngay' : 'Book Now'}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PromotionsSection;
