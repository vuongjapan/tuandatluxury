import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle, Download, Home, Calendar, Users, Phone, Mail, FileText } from 'lucide-react';
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
        {/* Success banner (not printed) */}
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
          {/* Invoice header */}
          <div className="bg-gold-gradient p-6 text-primary-foreground">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold">TUẤN ĐẠT LUXURY</h1>
                <p className="text-primary-foreground/80 text-sm mt-1">LK29-20 FLC Sầm Sơn, Thanh Hóa</p>
                <p className="text-primary-foreground/80 text-sm">Hotline: 098.661.7939</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <FileText className="h-4 w-4" />
                  <span className="font-semibold text-sm">HÓA ĐƠN ĐẶT PHÒNG</span>
                </div>
                <p className="text-sm opacity-80">{invoice?.invoice_number || 'INV-' + booking.booking_code}</p>
                <p className="text-xs opacity-70 mt-1">{format(new Date(booking.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Booking code */}
            <div className="bg-secondary rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Mã đặt phòng</p>
              <p className="font-display text-3xl font-bold text-primary tracking-widest">{booking.booking_code}</p>
              <p className="text-xs text-muted-foreground mt-1">Lưu mã này để tra cứu đặt phòng</p>
            </div>

            {/* Guest info */}
            <div>
              <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">Thông tin khách</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium">{booking.guest_name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>{booking.guest_phone}</span>
                </div>
                {booking.guest_email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>{booking.guest_email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stay info */}
            <div>
              <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">Chi tiết lưu trú</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Nhận phòng</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">{format(new Date(booking.check_in), 'dd/MM/yyyy')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Sau 14:00</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Trả phòng</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">{format(new Date(booking.check_out), 'dd/MM/yyyy')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Trước 12:00</p>
                </div>
              </div>
            </div>

            {/* Price table */}
            <div>
              <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">Chi tiết thanh toán</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">Hạng phòng</th>
                    <th className="text-center py-2 text-muted-foreground font-medium">Số đêm</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Đơn giá</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-3 font-medium">{booking.rooms?.name_vi || booking.room_id}</td>
                    <td className="py-3 text-center">{nights}</td>
                    <td className="py-3 text-right">{pricePerNight.toLocaleString('vi')}₫</td>
                    <td className="py-3 text-right font-semibold">{booking.total_price_vnd.toLocaleString('vi')}₫</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="py-4 text-right font-semibold">TỔNG CỘNG</td>
                    <td className="py-4 text-right">
                      <span className="text-xl font-bold text-primary">{booking.total_price_vnd.toLocaleString('vi')}₫</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
              <span className="text-sm font-semibold text-muted-foreground">Trạng thái</span>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                booking.status === 'confirmed' ? 'bg-chart-2/20 text-chart-2' :
                booking.status === 'cancelled' ? 'bg-destructive/20 text-destructive' :
                'bg-chart-4/20 text-chart-4'
              }`}>
                {booking.status === 'confirmed' ? '✓ Đã xác nhận' :
                 booking.status === 'cancelled' ? '✗ Đã hủy' : '⏳ Chờ xác nhận'}
              </span>
            </div>

            {/* Notes */}
            {booking.guest_notes && (
              <div className="p-3 bg-secondary rounded-lg text-sm">
                <p className="font-semibold text-muted-foreground mb-1">Ghi chú:</p>
                <p>{booking.guest_notes}</p>
              </div>
            )}

            {/* Footer note */}
            <p className="text-xs text-muted-foreground text-center border-t border-border pt-4">
              Cảm ơn quý khách đã tin tưởng Tuấn Đạt Luxury Hotel!<br />
              Mọi thắc mắc xin liên hệ hotline: 098.661.7939
            </p>
          </div>
        </motion.div>

        {/* Action buttons (not printed) */}
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
