import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle, Download, Home, Phone, Mail, Copy, Check, Gift, Building2, Heart, UtensilsCrossed, BedDouble, CalendarDays, Users, Clock } from 'lucide-react';
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
  const [comboDishes, setComboDishes] = useState<Record<string, any[]>>({});
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
      const comboList = bc || [];
      setCombos(comboList);

      // Fetch dishes for each combo by looking up combo_menus matching the package
      if (comboList.length > 0) {
        const dishMap: Record<string, any[]> = {};
        for (const combo of comboList) {
          // combo.dining_item_id = combo_packages.id
          // combo.combo_name = "Package Name – Menu Name"
          const parts = combo.combo_name?.split(' – ') || [];
          const menuName = parts.length > 1 ? parts.slice(1).join(' – ') : '';
          
          if (menuName && combo.dining_item_id) {
            // Find matching combo_menu
            const { data: menus } = await supabase
              .from('combo_menus')
              .select('id, name_vi, name_en')
              .eq('combo_package_id', combo.dining_item_id)
              .eq('is_active', true);
            
            const matchedMenu = menus?.find(m => 
              m.name_vi === menuName || m.name_en === menuName
            );
            
            if (matchedMenu) {
              const { data: dishes } = await supabase
                .from('combo_menu_dishes')
                .select('name_vi, sort_order')
                .eq('combo_menu_id', matchedMenu.id)
                .order('sort_order');
              dishMap[combo.id] = dishes || [];
            }
          }
        }
        setComboDishes(dishMap);
      }
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
  const roomSubtotal = Math.max(0, originalPrice - comboTotal);
  const pricePerNight = nights > 0 && roomQty > 0 ? Math.round(roomSubtotal / nights / roomQty) : 0;
  const depositAmount = booking.deposit_amount || Math.round(booking.total_price_vnd * 0.5);
  const remainingAmount = booking.remaining_amount || (booking.total_price_vnd - depositAmount);
  const isDepositPaid = booking.payment_status === 'DEPOSIT_PAID' || booking.payment_status === 'PAID';
  
  const promotionDiscount = booking.promotion_discount_amount || 0;
  const memberDiscount = booking.member_discount_amount || 0;
  const discountCodeAmt = booking.discount_code_amount || 0;
  const totalDiscount = promotionDiscount + memberDiscount + discountCodeAmt;
  const hasDiscount = totalDiscount > 0 || booking.discount_code;

  const qrUrl = `https://qr.sepay.vn/img?acc=${VA_ACCOUNT}&bank=${VA_BANK}&amount=${depositAmount}&des=${encodeURIComponent(booking.booking_code)}`;

  const fmt = (n: number) => n.toLocaleString('vi') + '₫';

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

            {/* Trạng thái & Thanh toán */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-secondary rounded-xl text-center">
                <p className="text-xs text-muted-foreground mb-1">Trạng thái</p>
                <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                  booking.status === 'confirmed' ? 'bg-chart-2/20 text-chart-2' :
                  booking.status === 'cancelled' ? 'bg-destructive/20 text-destructive' :
                  'bg-chart-4/20 text-chart-4'
                }`}>
                  {booking.status === 'confirmed' ? '✓ Đã xác nhận' :
                   booking.status === 'cancelled' ? '✗ Đã hủy' : '⏳ Chờ xác nhận'}
                </span>
              </div>
              <div className="p-3 bg-secondary rounded-xl text-center">
                <p className="text-xs text-muted-foreground mb-1">Thanh toán</p>
                <span className={`font-bold px-3 py-1 rounded-full text-xs ${
                  isDepositPaid ? 'bg-chart-2/20 text-chart-2' : 'bg-amber-100 text-amber-700'
                }`}>
                  {isDepositPaid ? '✅ Đã cọc 50%' : '⏳ Chưa thanh toán'}
                </span>
              </div>
            </div>

            {/* Ưu đãi đã áp dụng */}
            {hasDiscount && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground text-sm">Ưu đãi đã áp dụng</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {memberDiscount > 0 && (
                    <div className="flex justify-between items-center bg-chart-2/5 rounded-lg px-2 py-1.5">
                      <span className="text-foreground">⭐ Giảm giá thành viên ({booking.member_discount_percent}%)</span>
                      <span className="font-bold text-chart-2">-{fmt(memberDiscount)}</span>
                    </div>
                  )}
                  {promotionDiscount > 0 && (
                    <div className="flex justify-between items-center bg-primary/5 rounded-lg px-2 py-1.5">
                      <span className="text-foreground">
                        🎁 {booking.promotion_name || 'Ưu đãi đặc biệt'} ({booking.promotion_discount_percent}%)
                      </span>
                      <span className="font-bold text-primary">-{fmt(promotionDiscount)}</span>
                    </div>
                  )}
                  {booking.discount_code && (
                    <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1.5">
                      <span className="text-foreground">
                        🎟️ Mã giảm giá: <strong className="text-primary">{booking.discount_code}</strong>
                        {booking.discount_code_type === 'percent' 
                          ? ` (${booking.discount_code_value}%)` 
                          : booking.discount_code_value ? ` (${fmt(booking.discount_code_value)})` : ''}
                        {' - '}
                        {booking.discount_code_type === 'percent' ? 'Giảm phần trăm' : 'Giảm trực tiếp'}
                      </span>
                      <span className="font-bold text-amber-700 dark:text-amber-400">
                        {discountCodeAmt > 0 ? `-${fmt(discountCodeAmt)}` : 'Đã áp dụng'}
                      </span>
                    </div>
                  )}
                  {totalDiscount > 0 && (
                    <div className="flex justify-between items-center border-t border-primary/20 pt-1.5 mt-1">
                      <span className="font-semibold text-foreground">💰 Tổng tiết kiệm:</span>
                      <span className="font-bold text-chart-2 text-sm">{fmt(totalDiscount)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Thông tin khách */}
            <div>
              <h3 className="font-display font-semibold text-base mb-3 border-b border-border pb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Thông tin khách hàng
              </h3>
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

            {/* Trang trí */}
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

            {/* ═══════ PHẦN 1: CHI TIẾT ĐẶT PHÒNG ═══════ */}
            <div>
              <h3 className="font-display font-semibold text-base mb-3 border-b-2 border-primary/30 pb-2 flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-primary" /> Chi tiết đặt phòng
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loại phòng:</span>
                  <span className="font-semibold text-foreground">{booking.rooms?.name_vi || booking.room_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số lượng phòng:</span>
                  <span className="font-medium">{roomQty} phòng</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số khách:</span>
                  <span className="font-medium">{booking.guests_count} người</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" /> Nhận phòng:
                  </span>
                  <span className="font-medium">{format(new Date(booking.check_in), 'EEEE, dd/MM/yyyy', { locale: vi })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" /> Trả phòng:
                  </span>
                  <span className="font-medium">{format(new Date(booking.check_out), 'EEEE, dd/MM/yyyy', { locale: vi })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tổng số đêm:</span>
                  <span className="font-semibold text-primary">{nights} đêm</span>
                </div>
              </div>

              {/* Room price breakdown */}
              <div className="mt-3 bg-secondary/70 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Giá phòng / đêm:</span>
                  <span className="font-medium">{fmt(pricePerNight)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tính:</span>
                  <span className="font-medium">{fmt(pricePerNight)} × {nights} đêm × {roomQty} phòng</span>
                </div>
                <div className="flex justify-between font-semibold text-sm border-t border-border pt-1 mt-1">
                  <span className="text-muted-foreground">Thành tiền phòng:</span>
                  <span className="text-foreground">{fmt(roomSubtotal)}</span>
                </div>
              </div>
            </div>

            {/* ═══════ PHẦN 2: COMBO ĂN UỐNG ═══════ */}
            {combos.length > 0 && (
              <div>
                <h3 className="font-display font-semibold text-base mb-3 border-b-2 border-primary/30 pb-2 flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-primary" /> Set ăn uống đã chọn
                </h3>
                <div className="space-y-4">
                  {combos.map((c: any, idx: number) => {
                    const parts = c.combo_name?.split(' – ') || [c.combo_name];
                    const packageName = parts[0] || '';
                    const menuName = parts.length > 1 ? parts.slice(1).join(' – ') : '';
                    const dishes = comboDishes[c.id] || [];
                    const comboItemTotal = c.price_vnd * c.quantity;
                    
                    return (
                      <div key={c.id} className="bg-secondary/50 rounded-xl p-4 border border-border/50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-foreground">{idx + 1}. {packageName}</p>
                            {menuName && (
                              <p className="text-xs text-primary font-medium mt-0.5">📋 {menuName}</p>
                            )}
                          </div>
                          <span className="font-bold text-primary text-sm">{fmt(comboItemTotal)}</span>
                        </div>
                        
                        <div className="flex gap-4 text-xs text-muted-foreground mb-2">
                          <span>💰 Đơn giá: {fmt(c.price_vnd)}/người</span>
                          <span>👥 Số lượng: {c.quantity} set</span>
                        </div>

                        {/* Dishes list */}
                        {dishes.length > 0 && (
                          <div className="mt-2 border-t border-border/50 pt-2">
                            <p className="text-xs font-semibold text-muted-foreground mb-1.5">🍽️ Thực đơn gồm {dishes.length} món:</p>
                            <div className="grid grid-cols-1 gap-0.5">
                              {dishes.map((dish, i) => (
                                <p key={i} className="text-xs text-muted-foreground pl-2">
                                  {i + 1}. {dish.name_vi}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Combo subtotal */}
                  <div className="bg-secondary/70 rounded-lg p-3">
                    <div className="flex justify-between font-semibold text-sm">
                      <span className="text-muted-foreground">Tổng set ăn uống ({combos.length} set):</span>
                      <span className="text-primary">{fmt(comboTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════ PHẦN 3: TỔNG HỢP CHI PHÍ ═══════ */}
            <div>
              <h3 className="font-display font-semibold text-base mb-3 border-b-2 border-primary/30 pb-2">
                💰 Tổng hợp chi phí
              </h3>
              <div className="space-y-2">
                {/* Room subtotal */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">🏨 Tiền phòng ({roomQty} phòng × {nights} đêm):</span>
                  <span className="font-medium">{fmt(roomSubtotal)}</span>
                </div>

                {/* Combo subtotal */}
                {comboTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">🍽️ Set ăn uống ({combos.length} set):</span>
                    <span className="font-medium">{fmt(comboTotal)}</span>
                  </div>
                )}

                {/* Subtotal before discount */}
                {hasDiscount && (
                  <>
                    <div className="flex justify-between border-t border-border pt-2">
                      <span className="text-muted-foreground font-semibold">Tạm tính:</span>
                      <span className="font-medium line-through text-muted-foreground">{fmt(originalPrice)}</span>
                    </div>
                    {memberDiscount > 0 && (
                      <div className="flex justify-between text-chart-2">
                        <span>⭐ Giảm thành viên ({booking.member_discount_percent}%):</span>
                        <span className="font-medium">-{fmt(memberDiscount)}</span>
                      </div>
                    )}
                    {promotionDiscount > 0 && (
                      <div className="flex justify-between text-chart-2">
                        <span>🎁 Giảm ưu đãi ({booking.promotion_discount_percent}%):</span>
                        <span className="font-medium">-{fmt(promotionDiscount)}</span>
                      </div>
                    )}
                    {booking.discount_code && discountCodeAmt > 0 && (
                      <div className="flex justify-between text-chart-2">
                        <span>🎟️ Mã {booking.discount_code} ({booking.discount_code_type === 'percent' ? `${booking.discount_code_value}%` : fmt(booking.discount_code_value || 0)}):</span>
                        <span className="font-medium">-{fmt(discountCodeAmt)}</span>
                      </div>
                    )}
                    {booking.discount_code && !discountCodeAmt && (
                      <div className="flex justify-between text-chart-2">
                        <span>🎟️ Mã: {booking.discount_code}:</span>
                        <span className="font-medium">Đã áp dụng</span>
                      </div>
                    )}
                  </>
                )}

                {/* Total */}
                <div className="flex justify-between border-t-2 border-primary/30 pt-2">
                  <span className="font-bold text-foreground text-base">TỔNG CỘNG{hasDiscount ? ' (sau giảm)' : ''}:</span>
                  <span className="font-bold text-primary text-lg">{fmt(booking.total_price_vnd)}</span>
                </div>

                {/* Payment breakdown */}
                <div className="bg-secondary rounded-xl p-3 mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tiền cọc (50%):</span>
                    <span className={`font-bold ${isDepositPaid ? 'text-chart-2' : 'text-amber-600'}`}>
                      {fmt(depositAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Đã thanh toán:</span>
                    <span className={`font-semibold ${isDepositPaid ? 'text-chart-2' : ''}`}>
                      {isDepositPaid ? fmt(depositAmount) : '0₫'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1">
                    <span className="text-muted-foreground font-semibold">Còn lại khi nhận phòng:</span>
                    <span className="font-bold text-primary">
                      {isDepositPaid ? fmt(remainingAmount) : fmt(booking.total_price_vnd)}
                    </span>
                  </div>
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
                    <p className="text-2xl font-bold text-destructive mt-1">{fmt(depositAmount)}</p>
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
                  Số tiền còn lại {fmt(remainingAmount)} thanh toán khi nhận phòng
                </p>
              </motion.div>
            )}

            {booking.guest_notes && (
              <div>
                <h3 className="font-display font-semibold text-base mb-3 border-b border-border pb-2">📝 Ghi chú</h3>
                <p className="text-muted-foreground bg-secondary rounded-lg p-3">{booking.guest_notes}</p>
              </div>
            )}

            {/* Thời gian đặt */}
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Thời gian đặt phòng: {format(new Date(booking.created_at), 'HH:mm - EEEE, dd/MM/yyyy', { locale: vi })}
              </p>
            </div>

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
              <p>Cảm ơn quý khách đã tin tưởng <strong className="text-primary">Tuấn Đạt Luxury Hotel</strong>!</p>
              <p className="mt-1">📞 Hotline: 098.360.5768 | 036.984.5422 | 098.661.7939</p>
              <p>📧 tuandatluxuryflc36hotel@gmail.com</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default InvoicePage;
