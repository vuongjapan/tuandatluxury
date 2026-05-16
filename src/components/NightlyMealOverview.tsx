import { CheckCircle2, AlertTriangle, Flag, Sun, Info, Phone } from 'lucide-react';
import type { NightInfo } from '@/hooks/useNightlyMandatoryInfo';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  nights: NightInfo[];
  mandatoryNights: NightInfo[];
  optionalNights: NightInfo[];
}

/**
 * Step 2 overview banner that lists each night of the stay and groups them
 * into "optional" vs "mandatory combo" buckets — driven by admin-configured
 * mandatory_combo_dates rules. Purely presentational.
 */
const NightlyMealOverview = ({ nights, mandatoryNights, optionalNights }: Props) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  if (nights.length === 0) return null;

  // Pick a representative mandatory rule (first one) for the explanatory banner —
  // typical stays only hit one rule at a time.
  const repRule = mandatoryNights.find(n => n.rule)?.rule || null;
  const isWeekendRule = repRule?.rule_type === 'weekday_month';
  const RuleIcon = isWeekendRule ? Sun : Flag;

  const ruleTitle =
    repRule?.banner_title?.trim() ||
    (repRule
      ? isWeekendRule
        ? isVi
          ? 'Cuối tuần mùa hè: Bắt buộc đặt combo ăn uống'
          : 'Summer weekend: Combo meal required'
        : `${repRule.label}: ${isVi ? 'Bắt buộc đặt combo ăn uống' : 'Combo meal required'}`
      : '');

  const ruleMessage =
    repRule?.banner_message?.trim() ||
    repRule?.note?.trim() ||
    (repRule
      ? isWeekendRule
        ? isVi
          ? 'Vào các ngày Thứ 6, Thứ 7, Chủ Nhật trong tháng 6 và tháng 7, nhà hàng phục vụ theo hình thức combo do lượng khách đông. Quý khách cần chọn combo ăn uống để tiếp tục đặt phòng. Nhà hàng phục vụ từ 07:00 – 21:30.'
          : 'On Fri/Sat/Sun in June and July, the restaurant serves only set combos due to high demand. Please pick a combo to continue. Hours: 07:00 – 21:30.'
        : isVi
          ? `Trong dịp ${repRule.label}, khách sạn áp dụng gói nghỉ dưỡng trọn gói bao gồm ăn uống. Quý khách vui lòng chọn ít nhất 1 combo ăn uống để hoàn tất đặt phòng.`
          : `During ${repRule.label}, our resort applies an all-inclusive package. Please select at least one meal combo to complete your booking.`
      : '');

  return (
    <div className="space-y-3">
      {/* Optional nights */}
      {optionalNights.length > 0 && (
        <div
          className="rounded-[10px] px-4 py-3.5 text-sm leading-[1.7] flex items-start gap-3"
          style={{ background: '#E3F2FD', borderLeft: '4px solid #1565C0' }}
        >
          <Info className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#1565C0' }} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold mb-2" style={{ color: '#0D3F73' }}>
              {isVi ? 'Ngày không bắt buộc đặt ăn' : 'Optional meal nights'}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {optionalNights.map(n => (
                <span
                  key={n.date}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                  style={{ background: '#fff', color: '#0D3F73', border: '1px solid #BBDEFB' }}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {n.dayLabel}, {n.formattedDate}
                </span>
              ))}
            </div>
            <p style={{ color: '#1A4A78' }}>
              {isVi
                ? 'Có thể đặt trước combo để phục vụ ngay khi nhận phòng, hoặc gọi món trực tiếp tại nhà hàng sau check-in. Nhà hàng phục vụ từ 07:00 – 21:30.'
                : 'You may pre-order a combo or order at the restaurant after check-in. Restaurant hours: 07:00 – 21:30.'}
            </p>
          </div>
        </div>
      )}

      {/* Mandatory nights */}
      {mandatoryNights.length > 0 && (
        <div
          className="rounded-[10px] px-4 py-3.5 text-sm leading-[1.7] flex items-start gap-3"
          style={{ background: '#FFF3E0', borderLeft: '4px solid #E65100' }}
        >
          <RuleIcon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#E65100' }} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold mb-2" style={{ color: '#7A2E00' }}>
              {isVi ? 'Ngày bắt buộc chọn combo' : 'Mandatory combo nights'}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {mandatoryNights.map(n => (
                <span
                  key={n.date}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
                  style={{ background: '#fff', color: '#7A2E00', border: '1px solid #FFCC80' }}
                >
                  <AlertTriangle className="h-3 w-3" />
                  {n.dayLabel}, {n.formattedDate}
                </span>
              ))}
            </div>
            {ruleTitle && (
              <p className="font-semibold" style={{ color: '#7A2E00' }}>
                {ruleTitle}
              </p>
            )}
            {ruleMessage && (
              <p style={{ color: '#8A3D11' }}>{ruleMessage}</p>
            )}
            <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: '#8A3D11', opacity: 0.85 }}>
              <Phone className="h-3 w-3" />
              {isVi ? 'Nếu có câu hỏi, liên hệ: ' : 'Questions? Contact: '}
              <a href="tel:0384418811" className="font-bold underline">038.441.8811</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NightlyMealOverview;
