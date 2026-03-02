import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import { useServices, type Service, type VehicleType } from '@/hooks/useServices';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Users, MapPin, Car, CheckCircle, Sparkles } from 'lucide-react';

const getUserDiscount = (tier: string | undefined) => {
  if (tier === 'super_vip') return 15;
  if (tier === 'vip') return 10;
  if (tier === 'normal') return 5;
  return 0;
};

const formatPrice = (p: number) => p.toLocaleString('vi-VN') + 'đ';

const Services = () => {
  const { t } = useLanguage();
  const { amenities, shuttles, isLoading } = useServices();
  const { user } = useAuth();
  const { toast } = useToast();
  const isVi = t('nav.rooms') === 'Hạng phòng';

  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [form, setForm] = useState({
    guest_name: '',
    guest_phone: '',
    guest_email: '',
    booking_date: '',
    booking_time: '',
    guests_count: '1',
    pickup_location: '',
    vehicle_type: '',
    payment_method: 'at_hotel',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const openBooking = (service: Service) => {
    setBookingService(service);
    setSuccess(false);
    setForm({
      guest_name: user?.fullName || '',
      guest_phone: user?.phone || '',
      guest_email: user?.email || '',
      booking_date: '',
      booking_time: '',
      guests_count: '1',
      pickup_location: '',
      vehicle_type: service.vehicle_types?.[0]?.type || '',
      payment_method: 'at_hotel',
      notes: '',
    });
  };

  const discount = getUserDiscount(user?.tier);
  const selectedVehicle = bookingService?.vehicle_types?.find((v: VehicleType) => v.type === form.vehicle_type);
  const basePrice = bookingService?.is_free ? 0 : (selectedVehicle?.price || bookingService?.price_vnd || 0);
  const finalPrice = Math.round(basePrice * (1 - discount / 100));

  const handleSubmit = async () => {
    if (!bookingService || !form.guest_name || !form.guest_phone || !form.booking_date) {
      toast({ title: 'Vui lòng điền đầy đủ thông tin', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('service_bookings').insert({
      service_id: bookingService.id,
      user_id: user?.id || null,
      guest_name: form.guest_name.trim(),
      guest_phone: form.guest_phone.trim(),
      guest_email: form.guest_email.trim() || null,
      booking_date: form.booking_date,
      booking_time: form.booking_time || null,
      guests_count: parseInt(form.guests_count) || 1,
      pickup_location: form.pickup_location.trim() || null,
      vehicle_type: form.vehicle_type || null,
      original_price_vnd: basePrice,
      discount_percent: discount,
      total_price_vnd: finalPrice,
      payment_method: form.payment_method,
      notes: form.notes.trim() || null,
    } as any);
    setSubmitting(false);
    if (error) {
      toast({ title: 'Lỗi đặt dịch vụ', description: error.message, variant: 'destructive' });
    } else {
      setSuccess(true);
      toast({ title: '🎉 Đặt dịch vụ thành công!' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-secondary to-background">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            {isVi ? 'Dịch vụ & Tiện nghi' : 'Services & Amenities'}
          </motion.h1>
          <div className="w-20 h-1 bg-gold-gradient mx-auto rounded-full mb-4" />
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {isVi
              ? 'Trải nghiệm dịch vụ cao cấp tại Tuấn Đạt Luxury FLC Sầm Sơn'
              : 'Experience premium services at Tuấn Đạt Luxury FLC Sầm Sơn'}
          </p>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl font-bold text-foreground mb-3">
              {isVi ? 'Tiện nghi nổi bật' : 'Featured Amenities'}
            </h2>
            <div className="w-16 h-1 bg-gold-gradient mx-auto rounded-full" />
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {amenities.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="group bg-card rounded-xl p-6 text-center border border-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
              >
                {s.image_url && (
                  <div className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity">
                    <img src={s.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="relative z-10">
                  <span className="text-4xl mb-3 block">{s.icon}</span>
                  <h3 className="font-display text-sm md:text-base font-semibold text-foreground mb-1">
                    {isVi ? s.name_vi : s.name_en}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {isVi ? s.description_vi : s.description_en}
                  </p>
                  {s.is_free && (
                    <Badge variant="outline" className="mt-2 text-xs border-primary/30 text-primary">
                      {isVi ? 'Miễn phí' : 'Free'}
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Shuttle Services Section */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl font-bold text-foreground mb-3">
              {isVi ? 'Dịch vụ đưa đón' : 'Shuttle Services'}
            </h2>
            <div className="w-16 h-1 bg-gold-gradient mx-auto rounded-full" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {shuttles.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group bg-card rounded-xl overflow-hidden border border-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
              >
                {/* Card image area */}
                <div className="h-40 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative overflow-hidden">
                  {s.image_url ? (
                    <img src={s.image_url} alt={s.name_vi} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <span className="text-6xl">{s.icon}</span>
                  )}
                  {s.is_free && (
                    <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground border-0">
                      {isVi ? 'Miễn phí' : 'Free'}
                    </Badge>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    {isVi ? s.name_vi : s.name_en}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {isVi ? s.description_vi : s.description_en}
                  </p>

                  {s.schedule && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>{s.schedule}</span>
                    </div>
                  )}

                  {s.vehicle_types && (
                    <div className="space-y-1.5 mb-3">
                      {(s.vehicle_types as VehicleType[]).map((v, vi) => (
                        <div key={vi} className="flex items-center justify-between text-xs bg-secondary rounded-lg px-3 py-1.5">
                          <span className="flex items-center gap-1.5">
                            <Car className="h-3 w-3 text-primary" />
                            {isVi ? v.type : v.type_en}
                          </span>
                          <span className="font-semibold text-primary">{formatPrice(v.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!s.is_free && !s.vehicle_types && (
                    <p className="text-lg font-bold text-primary mb-3">{formatPrice(s.price_vnd)}</p>
                  )}

                  <Button variant="gold" className="w-full" onClick={() => openBooking(s)}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isVi ? 'Đặt ngay' : 'Book Now'}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Dialog */}
      <Dialog open={!!bookingService} onOpenChange={(o) => { if (!o) setBookingService(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {bookingService && (
                <span className="flex items-center gap-2">
                  <span>{bookingService.icon}</span>
                  {isVi ? bookingService.name_vi : bookingService.name_en}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {success ? (
            <div className="py-8 text-center">
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold mb-2">
                {isVi ? 'Đặt dịch vụ thành công!' : 'Service booked!'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {isVi
                  ? 'Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.'
                  : 'We will confirm your booking shortly.'}
              </p>
              <Button className="mt-4" onClick={() => setBookingService(null)}>
                {isVi ? 'Đóng' : 'Close'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Guest info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{isVi ? 'Họ tên *' : 'Full name *'}</label>
                  <Input value={form.guest_name} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{isVi ? 'Số điện thoại *' : 'Phone *'}</label>
                  <Input value={form.guest_phone} onChange={e => setForm(f => ({ ...f, guest_phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input type="email" value={form.guest_email} onChange={e => setForm(f => ({ ...f, guest_email: e.target.value }))} />
              </div>

              {/* Date & time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {isVi ? 'Ngày *' : 'Date *'}
                  </label>
                  <Input type="date" value={form.booking_date} onChange={e => setForm(f => ({ ...f, booking_date: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {isVi ? 'Giờ' : 'Time'}
                  </label>
                  <Input type="time" value={form.booking_time} onChange={e => setForm(f => ({ ...f, booking_time: e.target.value }))} />
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> {isVi ? 'Số khách' : 'Guests'}
                </label>
                <Input type="number" min="1" value={form.guests_count} onChange={e => setForm(f => ({ ...f, guests_count: e.target.value }))} />
              </div>

              {/* Pickup location for shuttles */}
              {bookingService?.category === 'shuttle' && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {isVi ? 'Địa điểm đón' : 'Pickup location'}
                  </label>
                  <Input value={form.pickup_location} onChange={e => setForm(f => ({ ...f, pickup_location: e.target.value }))} placeholder={isVi ? 'VD: Sảnh khách sạn, sân bay Thọ Xuân...' : 'e.g. Hotel lobby...'} />
                </div>
              )}

              {/* Vehicle type */}
              {bookingService?.vehicle_types && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Car className="h-3 w-3" /> {isVi ? 'Loại xe' : 'Vehicle'}
                  </label>
                  <Select value={form.vehicle_type} onValueChange={v => setForm(f => ({ ...f, vehicle_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(bookingService.vehicle_types as VehicleType[]).map(v => (
                        <SelectItem key={v.type} value={v.type}>
                          {isVi ? v.type : v.type_en} — {formatPrice(v.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Payment method */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">{isVi ? 'Phương thức thanh toán' : 'Payment'}</label>
                <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="at_hotel">{isVi ? 'Thanh toán tại khách sạn' : 'Pay at hotel'}</SelectItem>
                    <SelectItem value="online">{isVi ? 'Thanh toán online' : 'Pay online'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">{isVi ? 'Ghi chú' : 'Notes'}</label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>

              {/* Price summary */}
              <div className="bg-secondary rounded-xl p-4 space-y-2">
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isVi ? 'Giảm giá thành viên' : 'Member discount'}</span>
                    <span className="text-primary font-semibold">-{discount}%</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>{isVi ? 'Tổng cộng' : 'Total'}</span>
                  <span className="text-primary">
                    {bookingService?.is_free && !selectedVehicle ? (isVi ? 'Miễn phí' : 'Free') : formatPrice(finalPrice)}
                  </span>
                </div>
                {!user && (
                  <p className="text-xs text-muted-foreground">
                    💡 {isVi ? 'Đăng nhập thành viên để nhận giảm giá!' : 'Sign in to get member discount!'}
                  </p>
                )}
              </div>

              <Button variant="gold" className="w-full" disabled={submitting} onClick={handleSubmit}>
                {submitting ? (isVi ? 'Đang xử lý...' : 'Processing...') : (isVi ? 'Xác nhận đặt dịch vụ' : 'Confirm Booking')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default Services;
