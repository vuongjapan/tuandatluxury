import { motion } from 'framer-motion';
import { Award, Building2, Check, ArrowRight, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useDiscountConfig } from '@/hooks/useDiscountConfig';
import { useLanguage } from '@/contexts/LanguageContext';

const HOTLINE = '0384418811';

const MembershipSection = () => {
  const { config } = useDiscountConfig();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  return (
    <section className="py-12 sm:py-16 bg-secondary">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-10"
        >
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {isVi ? 'Chương Trình Thành Viên' : 'Membership Program'}
          </h2>
          <div className="w-16 h-0.5 bg-primary mx-auto rounded-full" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* VIP Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-card hover:shadow-luxury transition-shadow relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-gradient opacity-10 rounded-full -translate-y-12 translate-x-12" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gold-gradient flex items-center justify-center mb-4 shadow-gold">
                <Award className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3">
                {isVi ? 'Thành Viên VIP' : 'VIP Member'}
              </h3>
              <ul className="space-y-2.5 mb-5 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    {isVi
                      ? <>Đặt từ <b>{config.vip_tier1_bookings}</b> lần: Giảm <b className="text-primary">{config.vip_tier1_discount}%</b> tiền phòng</>
                      : <>From <b>{config.vip_tier1_bookings}</b> bookings: <b className="text-primary">{config.vip_tier1_discount}%</b> off room</>}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    {isVi
                      ? <>Đặt từ <b>{config.vip_tier2_bookings}</b> lần: Giảm <b className="text-primary">{config.vip_tier2_discount}%</b> tiền phòng</>
                      : <>From <b>{config.vip_tier2_bookings}</b> bookings: <b className="text-primary">{config.vip_tier2_discount}%</b> off room</>}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{isVi ? 'Ưu tiên phòng đẹp · Check-in sớm' : 'Priority room selection · Early check-in'}</span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground mb-4 italic">
                {isVi ? '* Chỉ áp dụng cho tiền phòng, không áp dụng đồ ăn' : '* Applies to room rate only, not food'}
              </p>
              <Button variant="gold" className="w-full gap-2" onClick={() => navigate('/member')}>
                {isVi ? 'Đăng nhập / Đăng ký ngay' : 'Sign in / Register'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Group Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-card hover:shadow-luxury transition-shadow relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-10 rounded-full -translate-y-12 translate-x-12" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3">
                {isVi ? 'Ưu Đãi Đoàn & Công Ty' : 'Group & Corporate Offers'}
              </h3>
              <ul className="space-y-2.5 mb-5 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    {isVi
                      ? <>Đoàn từ <b>{config.group_min_people}</b> người trở lên</>
                      : <>Groups of <b>{config.group_min_people}</b>+ people</>}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    {isVi
                      ? <>Giảm <b className="text-primary">{config.group_discount_min}–{config.group_discount_max}%</b> tùy quy mô</>
                      : <><b className="text-primary">{config.group_discount_min}–{config.group_discount_max}%</b> off depending on size</>}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{isVi ? 'Hỗ trợ hóa đơn GTGT · Thanh toán sau' : 'VAT invoice · Pay after'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{config.group_note}</span>
                </li>
              </ul>
              <Button variant="gold" className="w-full gap-2" asChild>
                <a href={`tel:${HOTLINE}`}>
                  <Phone className="h-4 w-4" />
                  {isVi ? 'Liên hệ báo giá đoàn' : 'Contact for group quote'}
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MembershipSection;
