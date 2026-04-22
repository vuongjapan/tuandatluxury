import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Flame, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPriceShort } from '@/lib/utils';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Room } from '@/data/rooms';
import type { SpecialDatePrice } from '@/hooks/useRooms';

const DAY_NAMES_BY_LANG: Record<string, string[]> = {
  vi: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ja: ['日', '月', '火', '水', '木', '金', '土'],
  zh: ['日', '一', '二', '三', '四', '五', '六'],
};

const MONTH_NAMES_BY_LANG: Record<string, string[]> = {
  vi: ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  ja: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  zh: ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
};

const LBL = {
  webDiscount: { vi: 'Giảm {p}% khi đặt qua website', en: '{p}% off on website booking', ja: 'ウェブ予約で{p}%割引', zh: '网站预订享{p}%折扣' },
  specialPrice:{ vi: 'Giá đặc biệt', en: 'Special price', ja: '特別料金', zh: '特价' },
  closed:      { vi: 'Đóng', en: 'Closed', ja: '休業', zh: '关闭' },
  combo:       { vi: 'Combo', en: 'Combo', ja: 'コンボ', zh: '套餐' },
  webPrice:    { vi: 'Giá web', en: 'Web price', ja: 'ウェブ価格', zh: '网价' },
  weekend:     { vi: 'Cuối tuần', en: 'Weekend', ja: '週末', zh: '周末' },
  sunday:      { vi: 'Chủ nhật', en: 'Sunday', ja: '日曜日', zh: '周日' },
  limited:     { vi: 'Giới hạn', en: 'Limited', ja: '残りわずか', zh: '剩余少' },
} as const;

interface PriceCalendarProps {
  room: Room;
  onSelectDate?: (date: Date) => void;
  selectedDate?: Date;
  getRoomPrice?: (room: Room, date: Date) => number;
  getAvailability?: (roomId: string, date: Date) => { status: string; rooms_available: number } | null;
  isSpecialDate?: (date: Date) => SpecialDatePrice | null;
}

const PriceCalendar = ({ room, onSelectDate, selectedDate, getRoomPrice, getAvailability, isSpecialDate }: PriceCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { settings } = useSiteSettings();
  const { language } = useLanguage();
  const webDiscountPercent = parseInt(settings.web_discount_percent || '0', 10);

  const lng = (DAY_NAMES_BY_LANG[language] ? language : 'en') as keyof typeof DAY_NAMES_BY_LANG;
  const dayNames = DAY_NAMES_BY_LANG[lng];
  const monthNames = MONTH_NAMES_BY_LANG[lng];
  const pick = (key: keyof typeof LBL) => (LBL[key] as any)[lng] || (LBL[key] as any).en;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells = useMemo(() => {
    const result: { date: Date | null; price: number; webPrice: number; isPast: boolean; status: string; isSpecial: boolean; specialNote: string | null }[] = [];
    for (let i = 0; i < firstDay; i++) result.push({ date: null, price: 0, webPrice: 0, isPast: true, status: 'open', isSpecial: false, specialNote: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isPast = date < today;
      const price = getRoomPrice ? getRoomPrice(room, date) : room.priceVND;
      const webPrice = webDiscountPercent > 0 ? Math.round(price * (100 - webDiscountPercent) / 100) : price;
      const avail = getAvailability ? getAvailability(room.id, date) : null;
      const status = avail?.status || 'open';
      const special = isSpecialDate ? isSpecialDate(date) : null;
      result.push({ date, price, webPrice, isPast, status, isSpecial: !!special, specialNote: special?.note || null });
    }
    return result;
  }, [year, month, room, firstDay, daysInMonth, getRoomPrice, getAvailability, isSpecialDate, webDiscountPercent]);

  return (
    <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(new Date(year, month - 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-display text-base sm:text-lg font-semibold text-foreground">
          {monthNames[month]} {year}
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(new Date(year, month + 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {webDiscountPercent > 0 && (
        <div className="mb-3 flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
          <Globe className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-xs font-medium text-green-700 dark:text-green-300">
            {pick('webDiscount').replace('{p}', String(webDiscountPercent))}
          </span>
        </div>
      )}

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-[11px] sm:text-xs font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={i} />;
          const isSelected = selectedDate && cell.date.toDateString() === selectedDate.toDateString();
          const isClosed = cell.status === 'closed';
          const isLimited = cell.status === 'limited';
          const isCombo = cell.status === 'combo';
          const isWeekend = cell.date.getDay() === 5 || cell.date.getDay() === 6;
          const isSunday = cell.date.getDay() === 0;
          const disabled = cell.isPast || isClosed;
          const hasWebDiscount = !cell.isPast && !isClosed && webDiscountPercent > 0;

          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onSelectDate?.(cell.date!)}
              title={cell.isSpecial ? (cell.specialNote || pick('specialPrice')) : undefined}
              className={`
                relative px-0.5 py-1 sm:p-1 rounded-lg text-center transition-all duration-200 min-h-[62px] sm:min-h-[68px] flex flex-col items-center justify-start gap-0.5
                ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-secondary cursor-pointer'}
                ${isSelected ? 'bg-primary/10 ring-2 ring-primary' : ''}
                ${isClosed ? 'bg-destructive/10 line-through' : ''}
                ${isLimited ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
                ${isCombo ? 'bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-300' : ''}
                ${cell.isSpecial && !disabled ? 'bg-red-50 dark:bg-red-900/20 ring-1 ring-red-400' : ''}
                ${isWeekend && !disabled && !isCombo && !cell.isSpecial ? 'bg-accent/20' : ''}
                ${isSunday && !disabled && !isCombo && !cell.isSpecial ? 'bg-orange-50 dark:bg-orange-900/20' : ''}
              `}
            >
              <span className="text-[11px] sm:text-sm font-semibold text-foreground leading-none">{cell.date.getDate()}</span>
              {!cell.isPast && !isClosed && (
                <div className="flex flex-col items-center leading-none w-full overflow-hidden">
                  {hasWebDiscount && (
                    <span className="text-[8px] sm:text-[10px] text-muted-foreground line-through leading-none truncate max-w-full">
                      {formatPriceShort(cell.price)}
                    </span>
                  )}
                  <span className={`text-[10px] sm:text-xs font-bold leading-tight truncate max-w-full ${
                    cell.isSpecial ? 'text-destructive' : hasWebDiscount ? 'text-green-600 dark:text-green-400' : 'text-primary'
                  }`}>
                    {formatPriceShort(hasWebDiscount ? cell.webPrice : cell.price)}
                  </span>
                </div>
              )}
              {cell.isSpecial && !cell.isPast && (
                <Flame className="h-2.5 w-2.5 text-destructive absolute top-0.5 right-0.5" />
              )}
              {isClosed && !cell.isPast && (
                <span className="text-[8px] sm:text-[10px] font-medium text-destructive">{pick('closed')}</span>
              )}
              {isCombo && !cell.isPast && (
                <span className="text-[8px] sm:text-[10px] font-medium text-purple-600 leading-none">{pick('combo')}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 text-[10px] sm:text-xs text-muted-foreground">
        {webDiscountPercent > 0 && (
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-400" /> {pick('webPrice')}</span>
        )}
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-red-50 dark:bg-red-900/30 border border-red-400" /> {pick('specialPrice')}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-accent/20" /> {pick('weekend')}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-orange-100 dark:bg-orange-900/30" /> {pick('sunday')}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-destructive/10" /> {pick('closed')}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300" /> {pick('limited')}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-purple-50 dark:bg-purple-900/30 border border-purple-300" /> {pick('combo')}</span>
      </div>
    </div>
  );
};

export default PriceCalendar;
