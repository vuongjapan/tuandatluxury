import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle, Download, Home, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const InvoicePage = () => {
  const { bookingCode } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      const { data: b } = await supabase
        .from('bookings')
        .select('*, rooms(name_vi, name_en)')
        .eq('booking_code', bookingCode)
        .maybeSingle();

      if (b) {
        setBooking(b);
        const { data: inv } = await supabase
          .from('invoices')
          .select('*')
          .eq('booking_id', b.id)
          .maybeSingle();
        setInvoice(inv);
      }
      setLoading(false);
    };
    fetchBooking();
  }, [bookingCode]);

  const handlePrint = () => window.print();

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-center p-4">
      <div>
        <h1 className="font-display text-2xl font-bold mb-2">Không tìm thấy đặt phòng</h1>
        <p className="text-muted-foreground mb-4">Mã đặt phòng "{bookingCode}" không tồn tại.</p>
        <Button onClick={() => navigate('/')}>Về trang chủ</Button>
      </div>
    </div>
  );

  const nights = Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24));
  const pricePerNight = nights > 0 ? Math.round(booking.total_price_vnd / nights) : 0;

  return (
    <div className="min-h-screen bg-secondary py-10 px-4 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto">
        {/* Success banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-card border border-border rounded-xl p-4 flex items-center gap-3 print:hidden"
        >
          <CheckCircle className="h-6 w-6 text-primary shrink-0" />
          <div>
            <p className="font-semibold text-foreground">Đặt phòng thành công!</p>
            <p className="text-sm text-muted-foreground">Chúng tôi sẽ liên hệ xác nhận trong vòng 30 phút.</p>
          </div>
        </motion.div>

        {/* Invoice card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-card-hover border border-border overflow-hidden print:shadow-none print:border-none"
        >
          {/* Header */}
          <div className="bg-gold-gradient p-6 text-primary-foreground">
            <p className="text-center text-lg mb-1">📋</p>
            <h1 className="font-display text-xl font-bold text-center tracking-wide">PHIẾU XÁC NHẬN ĐẶT PHÒNG</h1>
            <p className="text-center text-sm text-primary-foreground/80 mt-0.5">BOOKING CONFIRMATION</p>

            <div className="mt-4 text-sm space-y-1 text-primary-foreground/90">
              <p><strong>Khách sạn:</strong> Tuấn Đạt Luxury</p>
              <p><strong>Địa chỉ:</strong> FLC Sầm Sơn, Thanh Hóa, Việt Nam</p>
              <p><strong>Hotline:</strong> 098.360.7568 | 036.984.5422 | 098.661.7939</p>
              <p><strong>Email:</strong> tuandatluxuryflc36hotel@gmail.com</p>
            </div>
          </div>

          <div className="p-6 space-y-5 text-sm">
            {/* Mã đặt phòng */}
            <div className="bg-secondary rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Mã đặt phòng</p>
              <p className="font-display text-3xl font-bold text-primary tracking-widest">{booking.booking_code}</p>
              <p className="text-xs text-muted-foreground mt-1">Lưu mã này để tra cứu đặt phòng</p>
            </div>

            {/* Trạng thái */}
            <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
              <span className="font-semibold text-muted-foreground">Trạng thái</span>
              <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                booking.status === 'confirmed' ? 'bg-chart-2/20 text-chart-2' :
                booking.status === 'cancelled' ? 'bg-destructive/20 text-destructive' :
                'bg-chart-4/20 text-chart-4'
              }`}>
                {booking.status === 'confirmed' ? '✓ Đã xác nhận' :
                 booking.status === 'cancelled' ? '✗ Đã hủy' : '⏳ Chờ xác nhận'}
              </span>
            </div>

            {/* Trạng thái thanh toán */}
            <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
              <span className="font-semibold text-muted-foreground">Thanh toán</span>
              <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                invoice?.status === 'paid' ? 'bg-chart-2/20 text-chart-2' :
                'bg-amber-100 text-amber-700'
              }`}>
                {invoice?.status === 'paid' ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán'}
              </span>
            </div>

            {/* Thông tin khách */}
            <div>
              <h3 className="font-display font-semibold text-base mb-3 border-b border-border pb-2">Thông tin khách</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Họ tên:</span>
                  <span className="font-medium">{booking.guest_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Số điện thoại:</span>
                  <span className="font-medium flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-primary" />{booking.guest_phone}</span>
                </div>
                {booking.guest_email && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-primary" />{booking.guest_email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin đặt phòng */}
            <div>
              <h3 className="font-display font-semibold text-base mb-3 border-b border-border pb-2">Thông tin đặt phòng</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loại phòng:</span>
                  <span className="font-medium">{booking.rooms?.name_vi || booking.room_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số khách:</span>
                  <span className="font-medium">{booking.guests_count} người</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày nhận phòng (Check-in):</span>
                  <span className="font-medium">{format(new Date(booking.check_in), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày trả phòng (Check-out):</span>
                  <span className="font-medium">{format(new Date(booking.check_out), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tổng số đêm:</span>
                  <span className="font-medium">{nights} đêm</span>
                </div>
              </div>
            </div>

            {/* Chi phí */}
            <div>
              <h3 className="font-display font-semibold text-base mb-3 border-b border-border pb-2">Chi phí</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giá phòng / đêm:</span>
                  <span className="font-medium">{pricePerNight.toLocaleString('vi')}₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tổng tiền:</span>
                  <span className="font-bold text-primary text-base">{booking.total_price_vnd.toLocaleString('vi')}₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đã đặt cọc:</span>
                  <span className="font-medium">0₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Còn lại khi nhận phòng:</span>
                  <span className="font-bold text-primary">{booking.total_price_vnd.toLocaleString('vi')}₫</span>
                </div>
              </div>
            </div>

            {/* Ghi chú */}
            {booking.guest_notes && (
              <div>
                <h3 className="font-display font-semibold text-base mb-3 border-b border-border pb-2">Ghi chú</h3>
                <p className="text-foreground bg-secondary rounded-lg p-3">{booking.guest_notes}</p>
              </div>
            )}

            {/* Lưu ý cuối */}
            <div className="border-t border-border pt-4 space-y-3 text-xs text-muted-foreground">
              <p>⏰ <strong>Khách sạn sẽ giữ phòng đến 18:00 ngày nhận phòng.</strong><br />
                Nếu có thay đổi hoặc hủy phòng, vui lòng liên hệ trước để được hỗ trợ.</p>

              <p className="text-center">
                Xin chân thành cảm ơn Quý khách đã lựa chọn <strong className="text-primary">Tuấn Đạt Luxury</strong>.<br />
                Chúc Quý khách có kỳ nghỉ tuyệt vời!
              </p>

              <div className="text-center pt-2 border-t border-border">
                <p className="font-semibold text-foreground">Trân trọng,</p>
                <p className="font-semibold text-foreground">Bộ phận lễ tân – Tuấn Đạt Luxury</p>
                <p>📞 098.360.7568 | 036.984.5422 | 098.661.7939</p>
                <p>📧 tuandatluxuryflc36hotel@gmail.com</p>
              </div>
            </div>

            {/* Số hóa đơn */}
            {invoice && (
              <p className="text-xs text-muted-foreground text-center">
                Số phiếu: {invoice.invoice_number} · Ngày: {format(new Date(booking.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
              </p>
            )}
          </div>
        </motion.div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-3 print:hidden">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
            <Home className="h-4 w-4 mr-2" />Về trang chủ
          </Button>
          <Button variant="hero" className="flex-1" onClick={handlePrint}>
            <Download className="h-4 w-4 mr-2" />In / Tải PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
