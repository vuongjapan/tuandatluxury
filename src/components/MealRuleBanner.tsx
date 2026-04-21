import { Flag, Sun, Info, Phone } from 'lucide-react';
import type { MandatoryComboDate } from '@/hooks/useMandatoryComboDates';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  rule: MandatoryComboDate | null;
}

/**
 * Banner shown at the top of the meal-selection step, explaining
 * whether food booking is mandatory (and why) or optional.
 */
const MealRuleBanner = ({ rule }: Props) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  // Case 3: Normal (non-mandatory) day
  if (!rule) {
    return (
      <div
        className="rounded-[10px] px-4 py-3.5 mb-5 text-sm leading-[1.7] flex items-start gap-3"
        style={{ background: '#E3F2FD', borderLeft: '4px solid #1565C0' }}
      >
        <Info className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#1565C0' }} />
        <div className="min-w-0">
          <p className="font-semibold mb-1" style={{ color: '#0D3F73' }}>
            {isVi ? 'Ăn uống không bắt buộc hôm nay' : 'Meals are optional today'}
          </p>
          <p style={{ color: '#1A4A78' }}>
            {isVi
              ? 'Bạn có thể chọn đặt trước combo ăn uống để được phục vụ ngay khi nhận phòng, hoặc bỏ qua và gọi món trực tiếp tại nhà hàng sau khi check-in. Nhà hàng phục vụ từ 07:00 – 21:30.'
              : 'You may pre-order a meal combo to be served right at check-in, or skip and order directly at the restaurant after check-in. Restaurant hours: 07:00 – 21:30.'}
          </p>
        </div>
      </div>
    );
  }

  const isWeekend = rule.rule_type === 'weekday_month';
  const bg = isWeekend ? '#FFF3E0' : '#FDECEA';
  const border = isWeekend ? '#E65100' : '#C62828';
  const titleColor = isWeekend ? '#7A2E00' : '#7A1414';
  const bodyColor = isWeekend ? '#8A3D11' : '#8A2424';
  const Icon = isWeekend ? Sun : Flag;

  const title = rule.banner_title?.trim()
    || (isWeekend
      ? (isVi ? 'Cuối tuần mùa hè: Bắt buộc đặt combo ăn uống' : 'Summer weekend: Combo meal required')
      : `${rule.label}: ${isVi ? 'Bắt buộc đặt combo ăn uống' : 'Combo meal required'}`);

  const message = rule.banner_message?.trim()
    || rule.note?.trim()
    || (isWeekend
      ? (isVi
          ? 'Vào các ngày Thứ 6, Thứ 7, Chủ Nhật trong tháng 6 và tháng 7, nhà hàng phục vụ theo hình thức combo do lượng khách đông. Quý khách cần chọn combo ăn uống để tiếp tục đặt phòng. Nhà hàng phục vụ từ 07:00 – 21:30.'
          : 'On Fridays, Saturdays and Sundays in June and July, the restaurant serves only set combos due to high demand. Please pick a combo to continue. Restaurant hours: 07:00 – 21:30.')
      : (isVi
          ? `Trong dịp ${rule.label}, khách sạn áp dụng gói nghỉ dưỡng trọn gói bao gồm ăn uống. Quý khách vui lòng chọn ít nhất 1 combo ăn uống để hoàn tất đặt phòng. Xin cảm ơn quý khách đã thông cảm và hợp tác.`
          : `During ${rule.label}, our resort applies an all-inclusive package. Please select at least one meal combo to complete your booking. Thank you for your understanding.`));

  return (
    <div
      className="rounded-[10px] px-4 py-3.5 mb-5 text-sm leading-[1.7] flex items-start gap-3"
      style={{ background: bg, borderLeft: `4px solid ${border}` }}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: border }} />
      <div className="min-w-0">
        <p className="font-semibold mb-1" style={{ color: titleColor }}>{title}</p>
        <p style={{ color: bodyColor }}>{message}</p>
        <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: bodyColor, opacity: 0.85 }}>
          <Phone className="h-3 w-3" />
          {isVi ? 'Nếu có câu hỏi, liên hệ: ' : 'Questions? Contact: '}
          <a href="tel:0384418811" className="font-bold underline">038.441.8811</a>
        </p>
      </div>
    </div>
  );
};

export default MealRuleBanner;
