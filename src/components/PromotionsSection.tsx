import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePromotions } from '@/hooks/usePromotions';
import { useAuth, MemberTier } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

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

  return (
    <section id="offers" className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
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
          {user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="mt-4"
            >
              <Badge className="bg-gold-gradient text-primary-foreground px-4 py-1 text-sm">
                {isVi
                  ? `🎉 Chào ${user.fullName}! Bạn đang được giảm thêm ${TIER_DISCOUNT[user.tier]}% nhờ hạng ${user.tier === 'super_vip' ? 'Siêu VIP' : user.tier === 'vip' ? 'VIP' : 'Thành viên'}`
                  : `🎉 Hi ${user.fullName}! Extra ${TIER_DISCOUNT[user.tier]}% off as ${user.tier.replace('_', ' ').toUpperCase()}`}
              </Badge>
            </motion.div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activePromotions.map((promo, i) => {
            const discount = getUserDiscount(promo);
            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group relative bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
              >
                {/* Image or gradient header */}
                {promo.image_url ? (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={promo.image_url}
                      alt={isVi ? promo.title_vi : promo.title_en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 h-40 bg-gradient-to-t from-card/80 to-transparent" />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent flex items-center justify-center">
                    <span className="text-5xl">{promo.icon}</span>
                  </div>
                )}

                {/* Discount badge */}
                {user && discount && discount > 0 && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className="bg-gold-gradient text-primary-foreground font-bold shadow-gold text-sm px-3 py-1">
                      -{discount}%
                    </Badge>
                  </div>
                )}

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
                    onClick={() => navigate('/booking')}
                  >
                    {isVi ? 'Đặt phòng ngay' : 'Book Now'}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {!user && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            viewport={{ once: true }}
            className="text-center mt-8 text-muted-foreground"
          >
            {isVi ? '🔑 ' : '🔑 '}
            <button
              onClick={() => navigate('/member')}
              className="text-primary underline underline-offset-4 hover:text-accent transition-colors font-medium"
            >
              {isVi ? 'Đăng nhập / Đăng ký' : 'Sign in / Register'}
            </button>
            {isVi
              ? ' để nhận ưu đãi giảm giá tự động theo hạng thành viên'
              : ' to get automatic tier-based discounts'}
          </motion.p>
        )}
      </div>
    </section>
  );
};

export default PromotionsSection;
