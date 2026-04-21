import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Clock, Copy, Check, Tag, Percent, ArrowRight, ShoppingCart, Flame, Calendar, Users, Star } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MembershipSection from '@/components/MembershipSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFlashSales, useDiscountCodes, useGlobalDiscounts, useSmartPricing, type FlashSaleItem } from '@/hooks/usePromotionSystem';
import { toast } from 'sonner';

const formatVND = (n: number) => n.toLocaleString('vi-VN') + '₫';

const Countdown = ({ endTime }: { endTime: string }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, new Date(endTime).getTime() - Date.now());
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return (
    <div className="flex items-center gap-1.5">
      {[
        { val: timeLeft.hours, label: 'h' },
        { val: timeLeft.minutes, label: 'm' },
        { val: timeLeft.seconds, label: 's' },
      ].map((t, i) => (
        <div key={i} className="bg-foreground text-background rounded-lg px-2.5 py-1.5 text-center min-w-[44px]">
          <span className="text-lg sm:text-xl font-bold font-mono">{String(t.val).padStart(2, '0')}</span>
          <span className="text-[10px] ml-0.5 opacity-70">{t.label}</span>
        </div>
      ))}
    </div>
  );
};

const FlashSaleCard = ({ item, isVi }: { item: FlashSaleItem; isVi: boolean }) => {
  const navigate = useNavigate();
  const percent = Math.round(((item.original_price - item.sale_price) / item.original_price) * 100);
  const soldPercent = Math.round((item.quantity_sold / item.quantity_limit) * 100);
  const isSoldOut = item.quantity_sold >= item.quantity_limit;

  const handleClick = () => {
    if (item.item_type === 'room') navigate(`/booking?room=${item.item_id}`);
    else navigate('/food-order');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-card rounded-xl border border-border overflow-hidden shadow-card hover:shadow-luxury hover:-translate-y-1 transition-all duration-300 relative"
    >
      {/* Badge */}
      <div className="absolute top-3 right-3 z-10">
        <Badge className="bg-destructive text-destructive-foreground font-bold text-sm px-2.5 py-1 animate-pulse">
          -{percent}%
        </Badge>
      </div>

      {/* Image */}
      <div className="aspect-video overflow-hidden bg-muted">
        {item.image_url ? (
          <img src={item.image_url} alt={isVi ? item.item_name_vi : item.item_name_en} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Flame className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-display text-sm sm:text-base font-bold text-foreground mb-2 line-clamp-2">
          {isVi ? item.item_name_vi : item.item_name_en}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg sm:text-xl font-bold text-destructive">{formatVND(item.sale_price)}</span>
          <span className="text-sm text-muted-foreground line-through">{formatVND(item.original_price)}</span>
        </div>

        {/* Sold progress */}
        <div className="mb-3">
          <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
            <span>{isVi ? 'Đã bán' : 'Sold'}: {item.quantity_sold}/{item.quantity_limit}</span>
            <span>{soldPercent}%</span>
          </div>
          <Progress value={soldPercent} className="h-2" />
        </div>

        <Button
          variant="gold"
          className="w-full"
          disabled={isSoldOut}
          onClick={handleClick}
        >
          {isSoldOut ? (isVi ? 'Đã hết' : 'Sold out') : (isVi ? 'Đặt ngay' : 'Book Now')}
          {!isSoldOut && <ArrowRight className="h-4 w-4 ml-1" />}
        </Button>
      </div>
    </motion.div>
  );
};

const DiscountTicket = ({ code, isVi }: { code: any; isVi: boolean }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code.code);
    setCopied(true);
    toast.success(isVi ? 'Đã copy mã!' : 'Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="relative bg-card rounded-xl border-2 border-dashed border-primary/30 overflow-hidden group hover:border-primary/60 transition-colors"
    >
      {/* Ticket notch decorations */}
      <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-background -translate-y-1/2" />
      <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-background -translate-y-1/2" />

      <div className="p-4 sm:p-5 flex items-center gap-4">
        <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-primary/10 flex items-center justify-center">
          <Tag className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-display text-sm sm:text-base font-bold text-foreground mb-1">
            {isVi ? code.title_vi : code.title_en}
          </h3>
          <p className="text-xs text-muted-foreground mb-2">
            {code.discount_type === 'percent'
              ? `${isVi ? 'Giảm' : 'Save'} ${code.discount_value}%`
              : `${isVi ? 'Giảm' : 'Save'} ${formatVND(code.discount_value)}`}
            {code.min_order_amount > 0 && ` · ${isVi ? 'Đơn từ' : 'Min'} ${formatVND(code.min_order_amount)}`}
          </p>
          <div className="flex items-center gap-2">
            <code className="text-sm sm:text-base font-bold font-mono text-primary bg-primary/10 px-3 py-1 rounded-lg tracking-wider">
              {code.code}
            </code>
            <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? (isVi ? 'Đã copy' : 'Copied') : 'Copy'}
            </Button>
          </div>
        </div>

        <div className="hidden sm:block shrink-0 text-right">
          <Badge variant="outline" className="text-xs">
            {code.applies_to === 'room' ? (isVi ? '🏨 Phòng' : '🏨 Room') :
             code.applies_to === 'food' ? (isVi ? '🍽️ Đồ ăn' : '🍽️ Food') :
             (isVi ? '✨ Tất cả' : '✨ All')}
          </Badge>
          <p className="text-[10px] text-muted-foreground mt-1">
            {isVi ? 'Còn' : 'Left'}: {code.max_uses - code.used_count}/{code.max_uses}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const Promotions = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  const { flashSales, loading: fsLoading } = useFlashSales();
  const { codes, loading: codesLoading } = useDiscountCodes();
  const { discounts, loading: gdLoading } = useGlobalDiscounts();
  const { rules, loading: spLoading } = useSmartPricing();

  const activeGlobal = discounts.filter(d => d.is_active);
  const activeRules = rules.filter(r => r.is_active);
  const isLoading = fsLoading && codesLoading && gdLoading && spLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-28 sm:pt-32 pb-12 bg-gradient-to-b from-destructive/5 via-background to-background">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="bg-destructive/10 text-destructive mb-4 text-sm px-4 py-1.5">
              <Zap className="h-4 w-4 mr-1.5" />
              {isVi ? 'Ưu đãi đặc biệt' : 'Special Offers'}
            </Badge>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3">
              {isVi ? 'Khuyến mại hôm nay' : "Today's Deals"}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {isVi
                ? 'Đặt trực tiếp tại website — giá tốt hơn mọi nền tảng OTA'
                : 'Book directly — better prices than any OTA platform'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Membership program — VIP + Group */}
      <MembershipSection />

      {/* Global Discount Banner */}
      {activeGlobal.length > 0 && (
        <section className="py-4 bg-primary/5 border-y border-primary/10">
          <div className="container mx-auto px-4">
            {activeGlobal.map(g => (
              <motion.div key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center"
              >
                <Badge className="bg-primary text-primary-foreground text-sm px-4 py-1.5">
                  <Percent className="h-4 w-4 mr-1.5" />
                  {isVi ? `Giảm trực tiếp -${g.discount_percent}%` : `Direct -${g.discount_percent}% off`}
                </Badge>
                <p className="text-sm text-foreground font-medium">
                  {isVi ? g.title_vi : g.title_en}
                </p>
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  {isVi ? '💎 Giá tốt hơn OTA' : '💎 Better than OTA'}
                </Badge>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Flash Sale */}
      {flashSales.length > 0 && (
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            {flashSales.map(sale => (
              <div key={sale.id}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-xl">
                      <Zap className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                        ⚡ {isVi ? sale.title_vi : sale.title_en}
                      </h2>
                      {sale.description_vi && (
                        <p className="text-sm text-muted-foreground">{isVi ? sale.description_vi : sale.description_en}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-muted-foreground">{isVi ? 'Kết thúc sau:' : 'Ends in:'}</span>
                    <Countdown endTime={sale.end_time} />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {(sale.items || []).map(item => (
                    <FlashSaleCard key={item.id} item={item} isVi={isVi} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Discount Codes */}
      {codes.length > 0 && (
        <section className="py-12 sm:py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
                🎫 {isVi ? 'Mã giảm giá' : 'Discount Codes'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isVi ? 'Nhập mã khi thanh toán để nhận ưu đãi' : 'Enter code at checkout for discounts'}
              </p>
            </motion.div>
            <div className="max-w-3xl mx-auto space-y-3">
              {codes.map(code => (
                <DiscountTicket key={code.id} code={code} isVi={isVi} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Smart Pricing Badges */}
      {activeRules.length > 0 && (
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
                🏷️ {isVi ? 'Giảm giá thông minh' : 'Smart Discounts'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isVi ? 'Ưu đãi tự động áp dụng khi đủ điều kiện' : 'Auto-applied when conditions are met'}
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {activeRules.map((rule, idx) => (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-card rounded-xl border border-border p-5 text-center hover:shadow-luxury transition-shadow"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    {rule.rule_type === 'early_bird' ? <Calendar className="h-6 w-6 text-primary" /> :
                     rule.rule_type === 'day_of_week' ? <Clock className="h-6 w-6 text-primary" /> :
                     <Users className="h-6 w-6 text-primary" />}
                  </div>
                  <Badge className="bg-primary/10 text-primary mb-2 text-sm px-3 py-1">
                    -{rule.discount_percent}%
                  </Badge>
                  <h3 className="font-display text-sm font-bold text-foreground mb-1">
                    {isVi ? rule.title_vi : rule.title_en}
                  </h3>
                  {rule.badge_text_vi && (
                    <p className="text-xs text-muted-foreground">{isVi ? rule.badge_text_vi : rule.badge_text_en}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {!isLoading && flashSales.length === 0 && codes.length === 0 && activeGlobal.length === 0 && activeRules.length === 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              {isVi ? 'Chưa có khuyến mại' : 'No promotions yet'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isVi ? 'Hãy quay lại sau — chúng tôi luôn cập nhật ưu đãi mới!' : 'Check back later — we always have new deals!'}
            </p>
            <Button variant="gold" onClick={() => navigate('/booking')} className="gap-2">
              {isVi ? 'Đặt phòng ngay' : 'Book Now'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">
              {isVi ? 'Đặt trực tiếp — Giá tốt nhất!' : 'Book Direct — Best Price!'}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              {isVi
                ? 'Giá trên website luôn tốt hơn các nền tảng OTA. Đặt ngay để nhận ưu đãi độc quyền.'
                : 'Website prices are always better than OTA. Book now for exclusive offers.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button variant="gold" size="lg" onClick={() => navigate('/booking')} className="gap-2 min-w-[200px]">
                {isVi ? 'Đặt phòng ngay' : 'Book Room'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/food-order')} className="gap-2 min-w-[200px]">
                <ShoppingCart className="h-4 w-4" />
                {isVi ? 'Đặt đồ ăn ngay' : 'Order Food'}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Promotions;
