import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Room } from '@/data/rooms';

interface PriceCalendarProps {
  room: Room;
  onSelectDate?: (date: Date) => void;
  selectedDate?: Date;
  getRoomPrice?: (room: Room, date: Date) => number;
  getAvailability?: (roomId: string, date: Date) => { status: string; rooms_available: number } | null;
}

const PriceCalendar = ({ room, onSelectDate, selectedDate, getRoomPrice, getAvailability }: PriceCalendarProps) => {
  const { formatPrice } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const cells = useMemo(() => {
    const result: { date: Date | null; price: number; isPast: boolean; status: string }[] = [];
    for (let i = 0; i < firstDay; i++) result.push({ date: null, price: 0, isPast: true, status: 'open' });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isPast = date < today;
      const price = getRoomPrice ? getRoomPrice(room, date) : room.priceVND;
      const avail = getAvailability ? getAvailability(room.id, date) : null;
      const status = avail?.status || 'open';
      result.push({ date, price, isPast, status });
    }
    return result;
  }, [year, month, room, firstDay, daysInMonth, getRoomPrice, getAvailability]);

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(year, month - 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-display text-lg font-semibold text-foreground">
          {monthNames[month]} {year}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(year, month + 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={i} />;
          const isSelected = selectedDate && cell.date.toDateString() === selectedDate.toDateString();
          const isClosed = cell.status === 'closed';
          const isLimited = cell.status === 'limited';
          const isCombo = cell.status === 'combo';
          const isWeekend = cell.date.getDay() === 5 || cell.date.getDay() === 6;
          const isSunday = cell.date.getDay() === 0;
          const disabled = cell.isPast || isClosed;

          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onSelectDate?.(cell.date!)}
              className={`
                relative p-1 rounded-lg text-center transition-all duration-200 min-h-[52px] flex flex-col items-center justify-center
                ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-secondary cursor-pointer'}
                ${isSelected ? 'bg-primary/10 ring-2 ring-primary' : ''}
                ${isClosed ? 'bg-destructive/10 line-through' : ''}
                ${isLimited ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
                ${isCombo ? 'bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-300' : ''}
                ${isWeekend && !disabled && !isCombo ? 'bg-accent/20' : ''}
                ${isSunday && !disabled && !isCombo ? 'bg-orange-50 dark:bg-orange-900/20' : ''}
              `}
            >
              <span className="text-sm font-medium text-foreground">{cell.date.getDate()}</span>
              {!cell.isPast && !isClosed && (
                <span className="text-[10px] font-medium text-primary leading-tight">
                  {formatPrice(cell.price).replace(/\.\d+/, '')}
                </span>
              )}
              {isClosed && !cell.isPast && (
                <span className="text-[9px] font-medium text-destructive">Đóng</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-accent/20" /> Cuối tuần (T6-T7)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-100 dark:bg-orange-900/30" /> Chủ nhật</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive/10" /> Đóng bán</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300" /> Giới hạn</span>
      </div>
    </div>
  );
};

export default PriceCalendar;
