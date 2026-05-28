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
    <div className="mx-auto w-full max-w-[50rem] rounded-lg border border-border bg-card/95 p-[clamp(1rem,2vw,1.5rem)] shadow-luxury backdrop-blur-md">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
        <div>
          <label className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {isVi ? 'Nhận phòng' : 'Check-in'}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('h-11 w-full justify-start text-left font-normal', !checkIn && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {checkIn ? format(checkIn, 'dd/MM/yyyy') : (isVi ? 'Chọn ngày' : 'Select date')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} disabled={(d) => { const t = new Date(); t.setHours(0,0,0,0); return d < t; }} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {isVi ? 'Trả phòng' : 'Check-out'}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('h-11 w-full justify-start text-left font-normal', !checkOut && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {checkOut ? format(checkOut, 'dd/MM/yyyy') : (isVi ? 'Chọn ngày' : 'Select date')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} disabled={(d) => { const t = new Date(); t.setHours(0,0,0,0); const min = checkIn ? new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate() + 1) : t; return d < min; }} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {isVi ? 'Số khách' : 'Guests'}
          </label>
          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger className="h-11 w-full">
              <Users className="mr-2 h-4 w-4 text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} {isVi ? 'khách' : 'guests'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="gold" className="h-11 w-full gap-2 text-sm uppercase tracking-[0.15em]" onClick={handleSearch}>
          <Search className="h-4 w-4" />
          {isVi ? 'Tìm phòng' : 'Search'}
        </Button>
      </div>
    </div>
  );

  return (
    embedded ? (
      <div className="absolute bottom-[clamp(1rem,4vw,2rem)] left-1/2 z-20 w-full -translate-x-1/2 px-[clamp(1rem,4vw,2rem)]">
        {searchCard}
      </div>
    ) : (
      <div className="relative z-20 -mt-[clamp(2rem,6vw,3rem)] mb-[clamp(1rem,3vw,1.5rem)]">
        <div className="section-container">{searchCard}</div>
      </div>
    )
  );
};

export default BookingSearch;
