import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, Users, Search, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
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
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative py-6 sm:py-10 bg-background"
    >
      <div className="container mx-auto px-4">
        <div className="relative max-w-5xl mx-auto">
          {/* Booking label */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-primary" />
            <p className="text-xs sm:text-sm text-muted-foreground tracking-wide">
              {isVi ? 'LK29-20 FLC Sầm Sơn, Thanh Hóa — Chỉ cách bãi biển 50m' : 'LK29-20 FLC Sầm Sơn, Thanh Hóa — Just 50m from the beach'}
            </p>
          </div>

          {/* Search bar */}
          <div className="bg-card rounded-2xl shadow-card-hover p-4 md:p-5 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              {/* Check-in */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  {t('search.checkin')}
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-11",
                        !checkIn && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {checkIn ? format(checkIn, 'dd/MM/yyyy') : t('search.checkin')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkIn}
                      onSelect={setCheckIn}
                      initialFocus
                      className="p-3 pointer-events-auto"
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Check-out */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  {t('search.checkout')}
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-11",
                        !checkOut && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {checkOut ? format(checkOut, 'dd/MM/yyyy') : t('search.checkout')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkOut}
                      onSelect={setCheckOut}
                      initialFocus
                      className="p-3 pointer-events-auto"
                      disabled={(date) => date < (checkIn || new Date())}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Guests */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  {t('search.guests')}
                </label>
                <Select value={guests} onValueChange={setGuests}>
                  <SelectTrigger className="w-full h-11">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} {t('search.guests')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button */}
              <Button variant="gold" className="w-full h-11 text-sm uppercase tracking-wider font-semibold" onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                {t('search.search')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default BookingSearch;
