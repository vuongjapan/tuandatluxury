import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, Users, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface BookingSearchProps {
  embedded?: boolean;
}

const BookingSearch = ({ embedded = false }: BookingSearchProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState('2');
  const isVi = t('nav.rooms') === 'Hạng phòng';

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (checkIn) params.set('checkin', format(checkIn, 'yyyy-MM-dd'));
    if (checkOut) params.set('checkout', format(checkOut, 'yyyy-MM-dd'));
    params.set('guests', guests);
    navigate(`/booking?${params.toString()}`);
  };

  const searchCard = (
    <div className="mx-auto w-full max-w-6xl rounded-2xl border border-border bg-card shadow-luxury p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="font-display text-xl sm:text-2xl font-semibold flex items-center gap-2">
          📅 {isVi ? 'Đặt phòng & Kiểm tra giá' : 'Book & Check Price'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isVi ? 'Chọn ngày nhận phòng, trả phòng và số lượng khách' : 'Select check-in, check-out dates and number of guests'}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:items-end">
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            {isVi ? 'Ngày nhận phòng' : 'Check-in Date'}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('h-12 w-full justify-start text-left font-normal border-primary/20 hover:border-primary/40', !checkIn && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {checkIn ? format(checkIn, 'dd/MM/yyyy') : (isVi ? 'Chọn ngày' : 'Select date')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} disabled={(d) => { const t = new Date(); t.setHours(0,0,0,0); return d < t; }} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            {isVi ? 'Ngày trả phòng' : 'Check-out Date'}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('h-12 w-full justify-start text-left font-normal border-primary/20 hover:border-primary/40', !checkOut && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {checkOut ? format(checkOut, 'dd/MM/yyyy') : (isVi ? 'Chọn ngày' : 'Select date')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} disabled={(d) => { const t = new Date(); t.setHours(0,0,0,0); const min = checkIn ? new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate() + 1) : t; return d < min; }} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            {isVi ? 'Số lượng khách' : 'Guests'}
          </label>
          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger className="h-12 w-full border-primary/20 hover:border-primary/40">
              <Users className="mr-2 h-4 w-4 text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 10, 15, 20].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} {isVi ? 'khách' : 'guests'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="gold" className="h-12 w-full gap-2 text-sm uppercase tracking-[0.15em] font-bold shadow-md hover:shadow-lg transition-all" onClick={handleSearch}>
          <Search className="h-4 w-4" />
          {isVi ? 'Kiểm tra giá' : 'Check Price'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="relative z-20 py-12 bg-secondary/30">
      <div className="section-container">
        {searchCard}
      </div>
    </div>
  );
};

export default BookingSearch;
