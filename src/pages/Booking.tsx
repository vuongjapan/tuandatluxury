import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { CalendarIcon, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import { useRooms } from '@/hooks/useRooms';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const BOOKING_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-booking`;

const Booking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language, t, formatPrice } = useLanguage();
  const { toast } = useToast();
  const { rooms, getRoomPrice, isDateAvailable } = useRooms();

  const preselectedRoom = searchParams.get('room') || (rooms[0]?.id ?? '');
  const preCheckin = searchParams.get('checkin');
  const preCheckout = searchParams.get('checkout');

  const [roomId, setRoomId] = useState(preselectedRoom);
  const [checkIn, setCheckIn] = useState<Date | undefined>(preCheckin ? new Date(preCheckin + 'T00:00:00') : undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(preCheckout ? new Date(preCheckout + 'T00:00:00') : undefined);
  const [guests, setGuests] = useState(searchParams.get('guests') || '2');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const room = rooms.find((r) => r.id === roomId) || rooms[0];

  const nightCount = checkIn && checkOut ? Math.max(differenceInDays(checkOut, checkIn), 1) : 0;

  // Check all nights are available
  const allNightsAvailable = useMemo(() => {
    if (!checkIn || !checkOut || nightCount <= 0 || !room) return true;
    const d = new Date(checkIn);
    for (let i = 0; i < nightCount; i++) {
      if (!isDateAvailable(room.id, d)) return false;
      d.setDate(d.getDate() + 1);
    }
    return true;
  }, [checkIn, checkOut, nightCount, room, isDateAvailable]);

  const totalPrice = useMemo(() => {
    if (!checkIn || !checkOut || nightCount <= 0 || !room) return 0;
    let total = 0;
    const d = new Date(checkIn);
    for (let i = 0; i < nightCount; i++) {
      total += getRoomPrice(room, d);
      d.setDate(d.getDate() + 1);
    }
    return total;
  }, [checkIn, checkOut, nightCount, room, getRoomPrice]);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name || !phone || !checkIn || !checkOut) {
      toast({ title: 'Vui lòng điền đầy đủ thông tin', variant: 'destructive' });
      return;
    }
    if (!allNightsAvailable) {
      toast({ title: 'Một số đêm đã đóng bán, vui lòng chọn ngày khác', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const resp = await fetch(BOOKING_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          room_id: roomId,
          guest_name: name,
          guest_email: email,
          guest_phone: phone,
          guest_notes: notes,
          check_in: format(checkIn, 'yyyy-MM-dd'),
          check_out: format(checkOut, 'yyyy-MM-dd'),
          guests_count: parseInt(guests),
          total_price_vnd: totalPrice,
          language,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Lỗi đặt phòng');
      navigate(`/invoice/${data.booking_code}`);
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!room) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl font-bold text-foreground mb-8 text-center"
          >
            {t('booking.title')}
          </motion.h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h2 className="font-display text-xl font-semibold">{t('nav.rooms')}</h2>
                <Select value={roomId} onValueChange={setRoomId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name[language]} - {formatPrice(r.priceVND)}{t('room.per_night')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('search.checkin')}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start", !checkIn && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkIn ? format(checkIn, 'dd/MM/yyyy') : t('search.checkin')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} initialFocus className="p-3 pointer-events-auto" disabled={(d) => d < new Date()} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('search.checkout')}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start", !checkOut && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkOut ? format(checkOut, 'dd/MM/yyyy') : t('search.checkout')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} initialFocus className="p-3 pointer-events-auto" disabled={(d) => d < (checkIn || new Date())} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('search.guests')}</label>
                    <Select value={guests} onValueChange={setGuests}>
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h2 className="font-display text-xl font-semibold">{t('booking.guest_info')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('booking.full_name')} *</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('booking.email')}</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('booking.phone')} *</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('booking.notes')}</label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-card rounded-xl border border-border p-6 sticky top-24 space-y-4">
                <h2 className="font-display text-xl font-semibold">{t('booking.summary')}</h2>
                <div className="rounded-lg overflow-hidden">
                  <img src={room.image} alt={room.name[language]} className="w-full h-40 object-cover" />
                </div>
                <h3 className="font-display text-lg font-semibold">{room.name[language]}</h3>
                <div className="space-y-2 text-sm">
                  {checkIn && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('search.checkin')}</span>
                      <span className="font-medium">{format(checkIn, 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                  {checkOut && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('search.checkout')}</span>
                      <span className="font-medium">{format(checkOut, 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                  {nightCount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('booking.nights')}</span>
                      <span className="font-medium">{nightCount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('search.guests')}</span>
                    <span className="font-medium">{guests}</span>
                  </div>
                </div>
                {!allNightsAvailable && nightCount > 0 && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
                    Một số đêm trong khoảng ngày đã chọn đang đóng bán. Vui lòng chọn ngày khác.
                  </div>
                )}
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="font-display text-lg font-semibold">{t('booking.total')}</span>
                    <span className="text-2xl font-bold text-primary">{totalPrice > 0 ? formatPrice(totalPrice) : '—'}</span>
                  </div>
                </div>
                <Button variant="hero" className="w-full" onClick={handleSubmit} disabled={submitting || !allNightsAvailable}>
                  {submitting ? 'Đang xử lý...' : t('booking.confirm')}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default Booking;
