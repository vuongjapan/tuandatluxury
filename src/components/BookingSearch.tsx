import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, Users, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const BookingSearch = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');
  const isVi = t('nav.rooms') === 'Hạng phòng';

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (checkIn) params.set('checkin', format(checkIn, 'yyyy-MM-dd'));
    if (checkOut) params.set('checkout', format(checkOut, 'yyyy-MM-dd'));
    params.set('adults', adults || '1');
    params.set('children', children || '0');
    navigate(`/booking?${params.toString()}`);
  };

  const searchCard = (
    <div className="mx-auto w-full max-w-5xl rounded-2xl border border-border bg-card shadow-luxury p-[clamp(1rem,2.5vw,1.75rem)]">
      <div className="mb-5">
        <h2 className="font-display text-xl sm:text-2xl font-semibold flex items-center gap-2 text-foreground">
          📅 {isVi ? 'Đặt phòng & Kiểm tra giá' : 'Book & Check Price'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isVi ? 'Chọn ngày nhận phòng, trả phòng và số lượng khách' : 'Select check-in, check-out dates and number of guests'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(11rem,0.8fr)_minmax(11rem,0.8fr)_auto] xl:items-end">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground">
            {isVi ? 'Nhận phòng' : 'Check-in'}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('h-12 w-full justify-start text-left font-normal', !checkIn && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkIn ? format(checkIn, 'dd/MM/yyyy') : (isVi ? 'Chọn ngày' : 'Select date')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} disabled={(d) => { const t = new Date(); t.setHours(0,0,0,0); return d < t; }} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground">
            {isVi ? 'Trả phòng' : 'Check-out'}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('h-12 w-full justify-start text-left font-normal', !checkOut && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkOut ? format(checkOut, 'dd/MM/yyyy') : (isVi ? 'Chọn ngày' : 'Select date')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} disabled={(d) => { const t = new Date(); t.setHours(0,0,0,0); const min = checkIn ? new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate() + 1) : t; return d < min; }} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground">
            {isVi ? 'Người lớn' : 'Adults'}
          </label>
          <div className="relative">
            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="number"
              min={1}
              max={70}
              inputMode="numeric"
              value={adults}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  setAdults('');
                  return;
                }
                const next = Math.max(1, Math.min(70, parseInt(raw, 10) || 1));
                setAdults(String(next));
              }}
              onBlur={() => {
                if (!adults || parseInt(adults, 10) < 1) setAdults('1');
              }}
              className="h-12 pl-9"
              aria-label={isVi ? 'Số người lớn' : 'Number of adults'}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground">
            {isVi ? 'Trẻ em' : 'Children'}
          </label>
          <div className="relative">
            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="number"
              min={0}
              max={30}
              inputMode="numeric"
              value={children}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  setChildren('');
                  return;
                }
                const next = Math.max(0, Math.min(30, parseInt(raw, 10) || 0));
                setChildren(String(next));
              }}
              onBlur={() => {
                if (!children || parseInt(children, 10) < 0) setChildren('0');
              }}
              className="h-12 pl-9"
              aria-label={isVi ? 'Số trẻ em' : 'Number of children'}
            />
          </div>
        </div>

        <Button variant="gold" className="h-12 w-full gap-2 text-sm font-bold uppercase tracking-[0.15em] xl:min-w-[13rem]" onClick={handleSearch}>
          <Search className="h-4 w-4" />
          {isVi ? 'Kiểm tra giá' : 'Check Price'}
        </Button>
      </div>
    </div>
  );

  return (
    <section className="relative z-20 bg-background py-[clamp(1rem,3vw,2rem)]">
      <div className="section-container">
        {searchCard}
      </div>
    </section>
  );
};

export default BookingSearch;
