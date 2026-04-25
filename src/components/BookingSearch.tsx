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

const BookingSearch = () => {
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

  return (
    <div className="relative z-20 -mt-8 sm:-mt-10 mb-4">
      <div className="section-container">
        <div className="max-w-4xl mx-auto bg-card/95 backdrop-blur-lg rounded-2xl border border-border shadow-luxury p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            {/* Check-in */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                {isVi ? 'Nhận phòng' : 'Check-in'}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal h-11', !checkIn && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {checkIn ? format(checkIn, 'dd/MM/yyyy') : (isVi ? 'Chọn ngày' : 'Select date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} disabled={(d) => { const t = new Date(); t.setHours(0,0,0,0); return d < t; }} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Check-out */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                {isVi ? 'Trả phòng' : 'Check-out'}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal h-11', !checkOut && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {checkOut ? format(checkOut, 'dd/MM/yyyy') : (isVi ? 'Chọn ngày' : 'Select date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} disabled={(d) => d < (checkIn || new Date())} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Guests */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                {isVi ? 'Số khách' : 'Guests'}
              </label>
              <Select value={guests} onValueChange={setGuests}>
                <SelectTrigger className="h-11">
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

            {/* Search */}
            <Button variant="gold" className="h-11 gap-2 text-sm tracking-wider uppercase font-semibold" onClick={handleSearch}>
              <Search className="h-4 w-4" />
              {isVi ? 'Tìm phòng' : 'Search'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSearch;
