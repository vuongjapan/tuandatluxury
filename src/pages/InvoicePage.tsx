import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle, Download, Home, Phone, Mail, Copy, Check, Gift, Building2, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const VA_BANK = 'BIDV';
const VA_ACCOUNT = '96247TUANDATLUXURY';
const VA_HOLDER = 'VAN DINH GIANG';

const InvoicePage = () => {
  const { bookingCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [combos, setCombos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchBooking = useCallback(async () => {
    const { data: b } = await supabase
      .from('bookings')
      .select('*, rooms(name_vi, name_en)')
      .eq('booking_code', bookingCode)
      .maybeSingle();

    if (b) {
      setBooking(b);
      const [{ data: inv }, { data: bc }] = await Promise.all([
        supabase.from('invoices').select('*').eq('booking_id', b.id).maybeSingle(),
        supabase.from('booking_combos').select('*').eq('booking_id', b.id),
      ]);
      setInvoice(inv);
      setCombos(bc || []);
    }
    setLoading(false);
  }, [bookingCode]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  useEffect(() => {
    if (!booking || booking.payment_status === 'DEPOSIT_PAID' || booking.payment_status === 'PAID') return;
    const interval = setInterval(async () => {
      const { data: b } = await supabase
        .from('bookings')
        .select('payment_status, status')
        .eq('booking_code', bookingCode)
        .maybeSingle();
      if (b && (b.payment_status === 'DEPOSIT_PAID' || b.payment_status === 'PAID')) {
        fetchBooking();
        clearInterval(interval);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [booking?.payment_status, bookingCode, fetchBooking]);

  const handlePrint = () => window.print();

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: 'Đã sao chép nội dung chuyển khoản!' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Không thể sao chép', variant: 'destructive' });
    }
  };

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
  const roomQty = booking.room_quantity || 1;
  const comboTotal = combos.reduce((sum: number, c: any) => sum + (c.price_vnd * c.quantity), 0);
  const originalPrice = booking.original_price_vnd || booking.total_price_vnd;
  const totalDiscount = (booking.promotion_discount_amount || 0) + (booking.member_discount_amount || 0);
  const roomPrice = originalPrice - comboTotal - totalDiscount;
  const pricePerNight = nights > 0 && roomQty > 0 ? Math.round(Math.max(0, originalPrice - comboTotal) / nights / roomQty) : 0;
  const depositAmount = booking.deposit_amount || Math.round(booking.total_price_vnd * 0.5);
  const remainingAmount = booking.remaining_amount || (booking.total_price_vnd - depositAmount);
  const isDepositPaid = booking.payment_status === 'DEPOSIT_PAID' || booking.payment_status === 'PAID';
  const hasDiscount = totalDiscount > 0 || booking.discount_code;

  const qrUrl = `https://qr.sepay.vn/img?acc=${VA_ACCOUNT}&bank=${VA_BANK}&amount=${depositAmount}&des=${encodeURIComponent(booking.booking_code)}`;

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
              <p><strong>Hotline:</strong> 098.360.5768 | 036.984.5422 | 098.661.7939</p>
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

            {/* Thanh toán */}
            <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
              <span className="font-semibold text-muted-foreground">Thanh toán</span>
              <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                isDepositPaid ? 'bg-chart-2/20 text-chart-2' : 'bg-amber-100 text-amber-700'
              }`}>
                {isDepositPaid ? '✅ Đã cọc 50%' : '⏳ Chưa thanh toán'}
              </span>
            </div>

            {/* Promotion/Discount applied banner */}
            {(booking.promotion_discount_percent > 0 || booking.member_discount_percent > 0 || booking.discount_code) && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground text-sm">Ưu đãi đã áp dụng</span>
                </div>
                <div className="space-y-1 text-xs">
                  {booking.member_discount_percent > 0 && (
                    <p className="text-muted-foreground">⭐ Giảm giá thành viên: {booking.member_discount_percent}% (-{(booking.member_discount_amount || 0).toLocaleString('vi')}₫)</p>
                  )}
                  {booking.promotion_discount_percent > 0 && (
                    <p className="text-muted-foreground">🎁 Giảm giá ưu đãi: {booking.promotion_discount_percent}% (-{(booking.promotion_discount_amount || 0).toLocaleString('vi')}₫)</p>
                  )}
                  {booking.discount_code && (
                    <p className="text-muted-foreground">🎟️ Mã giảm giá: <strong>{booking.discount_code}</strong></p>
                  )}
                </div>
              </div>
            )}

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

            {/* Thông tin công ty / đoàn */}
            {booking.company_name && (
              <div>
                <h3 className="font-display font-semibold text-base mb-3 border-b border-border pb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> Thông tin đoàn / công ty
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tên công ty:</span>
                    <span className="font-medium">{booking.company_name}</span>
                  </div>
                  {booking.group_size && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Số lượng người:</span>
                      <span className="font-medium">{booking.group_size} người</span>
                    </div>
                  )}
                  {booking.special_services && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dịch vụ yêu cầu:</span>
                      <span className="font-medium text-right max-w-[200px]">{booking.special_services}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trang trí (couple) */}
            {booking.decoration_notes && (
              <div>
                <h3 className="font-display font-semibold text-base mb-3 border-b border-border pb-2 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" /> Yêu cầu trang trí
                </h3>
                <p className="text-muted-foreground">{booking.decoration_notes}</p>
                {booking.special_services && !booking.company_name && (
                  <div className="flex justify-between mt-2">
                    <span className="text-muted-foreground">Dịch vụ đi kèm:</span>
                    <span className="font-medium text-right max-w-[200px]">{booking.special_services}</span>
                  </div>
                )}
              </div>
            )}

            {/* Thông tin đặt phòng */}
            <div>
              <h3 className="font-display font-semibold text-base mb-3 border-b border-border pb-2">Thông tin đặt phòng</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loại phòng:</span>
                  <span className="font-medium">{booking.rooms?.name_vi || booking.room_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số phòng:</span>
                  <span className="font-medium">{roomQty}</span>
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

            {/* Combo ăn uống */}
            {combos.length > 0 && (
              <div>
                <h3 className="font-display font-semibold text-base mb-3 border-b border-border pb-2">🍽️ Combo ăn uống</h3>
                <div className="space-y-2">
                  {combos.map((c: any) => (
                    <div key={c.id} className="flex justify-between">
                      <span className="text-muted-foreground">{c.combo_name} ×{c.quantity}</span>
                      <span className="font-medium">{(c.price_vnd * c.quantity).toLocaleString('vi')}₫</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold border-t border-border pt-1">
                    <span className="text-muted-foreground">Tổng combo:</span>
                    <span className="text-primary">{comboTotal.toLocaleString('vi')}₫</span>
                  </div>
                </div>
              </div>
            )}

            {/* Chi phí */}
            <div>
              <h3 className="font-display font-semibold text-base mb-3 border-b border-border pb-2">Chi phí</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giá phòng / đêm:</span>
                  <span className="font-medium">{pricePerNight.toLocaleString('vi')}₫</span>
                </div>
                {roomQty > 1 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số phòng × Số đêm:</span>
                    <span className="font-medium">{roomQty} × {nights}</span>
                  </div>
                )}

                {hasDiscount && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Giá gốc:</span>
                      <span className="font-medium line-through text-muted-foreground">{originalPrice.toLocaleString('vi')}₫</span>
                    </div>
                    {booking.member_discount_amount > 0 && (
                      <div className="flex justify-between text-primary">
                        <span>Giảm thành viên ({booking.member_discount_percent}%):</span>
                        <span className="font-medium">-{booking.member_discount_amount.toLocaleString('vi')}₫</span>
                      </div>
                    )}
                    {booking.promotion_discount_amount > 0 && (
                      <div className="flex justify-between text-primary">
                        <span>Giảm ưu đãi ({booking.promotion_discount_percent}%):</span>
                        <span className="font-medium">-{booking.promotion_discount_amount.toLocaleString('vi')}₫</span>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tổng tiền{hasDiscount ? ' (sau giảm)' : ''}:</span>
                  <span className="font-bold text-primary text-base">{booking.total_price_vnd.toLocaleString('vi')}₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tiền cọc (50%):</span>
                  <span className={`font-bold ${isDepositPaid ? 'text-chart-2' : 'text-amber-600'}`}>
                    {depositAmount.toLocaleString('vi')}₫
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đã thanh toán:</span>
                  <span className={`font-medium ${isDepositPaid ? 'text-chart-2' : ''}`}>
                    {isDepositPaid ? depositAmount.toLocaleString('vi') + '₫' : '0₫'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Còn lại khi nhận phòng:</span>
                  <span className="font-bold text-primary">
                    {isDepositPaid ? remainingAmount.toLocaleString('vi') : booking.total_price_vnd.toLocaleString('vi')}₫
                  </span>
                </div>
              </div>
            </div>

            {/* QR Payment */}
            {!isDepositPaid && (
              <div className="border-2 border-dashed border-amber-400 rounded-xl p-5 bg-amber-50 print:border-amber-300">
                <h3 className="font-display font-semibold text-base mb-4 text-center text-amber-900">💳 THANH TOÁN ĐẶT CỌC</h3>
                <div className="bg-white rounded-lg p-4 mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">🏦 Ngân hàng:</span>
                    <span className="font-bold">{VA_BANK}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">🔢 Số tài khoản (VA):</span>
                    <span className="font-bold">{VA_ACCOUNT}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">👤 Chủ tài khoản:</span>
                    <span className="font-bold">{VA_HOLDER}</span>
                  </div>
                  <p className="text-xs text-amber-700 text-center mt-2">
                    ⚠️ Chỉ chuyển khoản qua tài khoản ảo (VA) hoặc quét mã QR bên dưới.
                  </p>
                </div>
                <div className="flex justify-center mb-4">
                  <img src={qrUrl} alt="QR Thanh toán SePay" className="w-64 rounded-lg shadow-md bg-white" />
                </div>
                <div className="text-center space-y-3">
                  <div>
                    <p className="text-xs text-amber-700 font-semibold uppercase">📌 Nội dung chuyển khoản:</p>
                    <p className="font-display text-xl font-bold text-primary tracking-widest mt-1">{booking.booking_code}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => handleCopy(booking.booking_code)}>
                      {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                      {copied ? 'Đã sao chép' : 'Sao chép'}
                    </Button>
                  </div>
                  <div>
                    <p className="text-xs text-amber-700 font-semibold uppercase">💰 Số tiền cần chuyển:</p>
                    <p className="text-2xl font-bold text-destructive mt-1">{depositAmount.toLocaleString('vi')}₫</p>
                  </div>
                </div>
                <p className="text-xs text-amber-700 text-center mt-3">
                  ⚡ Quét QR để tự điền số tiền và nội dung. Trạng thái sẽ tự động cập nhật sau khi chuyển khoản.
                </p>
              </div>
            )}

            {isDepositPaid && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-chart-2/10 border border-chart-2/30 rounded-xl p-4 text-center"
              >
                <CheckCircle className="h-8 w-8 text-chart-2 mx-auto mb-2" />
                <p className="font-bold text-chart-2 text-lg">Đã cọc 50% thành công!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Số tiền còn lại {remainingAmount.toLocaleString('vi')}₫ thanh toán khi nhận phòng
                </p>
              </motion.div>
            )}

            {booking.guest_notes && (
              <div>
                <h3 className="font-display font-semibold text-base mb-3 border-b border-border pb-2">Ghi chú</h3>
                <p className="text-muted-foreground">{booking.guest_notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 print:hidden pt-4 border-t border-border">
              <Button variant="gold" onClick={handlePrint}>
                <Download className="h-4 w-4 mr-2" /> In / Tải hóa đơn
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                <Home className="h-4 w-4 mr-2" /> Về trang chủ
              </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground pt-4">
              <p>Cảm ơn quý khách đã tin tưởng Tuấn Đạt Luxury Hotel!</p>
              <p className="mt-1">📞 Hotline: 098.360.5768 | 036.984.5422 | 098.661.7939</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default InvoicePage;
