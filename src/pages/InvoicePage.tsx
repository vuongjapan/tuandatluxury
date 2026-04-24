import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { DownloadPDFButtons } from '@/components/DownloadPDFButtons';

const VA_BANK = 'BIDV';
const VA_ACCOUNT = '96247TUANDATLUXURY';
const VA_HOLDER = 'VAN DINH GIANG';
const HOTEL_NAME = 'Tuấn Đạt Luxury Hotel';
const HOTEL_ADDRESS = 'LK29-20 cạnh cổng FLC Sầm Sơn, Thanh Hóa';
const HOTEL_MAP = 'https://www.google.com/maps/search/?api=1&query=Tu%E1%BA%A5n+%C4%90%E1%BA%A1t+Luxury+FLC+S%E1%BA%A7m+S%C6%A1n';
const HOTEL_PHONES = '098.360.5768 | 036.984.5422 | 038.441.8811';
const HOTEL_EMAIL = 'tuandatluxuryflc36hotel@gmail.com';

const parseGuestBreakdown = (notes?: string | null) => {
  const rawNotes = typeof notes === 'string' ? notes : '';
  const match = rawNotes.match(/\[Khách:\s*(\d+)\s*người lớn(?:\s*·\s*(\d+)\s*trẻ em[^\]]*)?\]/i);

  return {
    adults: match ? parseInt(match[1] || '0', 10) : 0,
    children: match ? parseInt(match[2] || '0', 10) : 0,
    cleanedNotes: rawNotes
      .replace(match?.[0] || '', '')
      .replace(/^\s*---\s*$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  };
};

const InvoicePage = () => {
  const { bookingCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [combos, setCombos] = useState<any[]>([]);
  const [comboDishes, setComboDishes] = useState<Record<string, any[]>>({});
  const [foodItems, setFoodItems] = useState<any[]>([]);
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
      const [{ data: bc }, { data: fi }] = await Promise.all([
        supabase.from('booking_combos').select('*').eq('booking_id', b.id),
        supabase.from('booking_food_items').select('*').eq('booking_id', b.id),
      ]);
      const comboList = bc || [];
      setCombos(comboList);
      setFoodItems(fi || []);

      if (comboList.length > 0) {
        const dishMap: Record<string, any[]> = {};
        for (const combo of comboList) {
          const snapshotDishes = Array.isArray(combo.dishes_snapshot) ? combo.dishes_snapshot : [];
          if (snapshotDishes.length > 0) { dishMap[combo.id] = snapshotDishes; continue; }
          if (combo.combo_menu_id) {
            const { data: dishes } = await supabase
              .from('combo_menu_dishes').select('name_vi, name_en, sort_order')
              .eq('combo_menu_id', combo.combo_menu_id).order('sort_order');
            dishMap[combo.id] = dishes || [];
          }
        }
        setComboDishes(dishMap);
      }
    }
    setLoading(false);
  }, [bookingCode]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  useEffect(() => {
    if (!booking || booking.payment_status === 'DEPOSIT_PAID' || booking.payment_status === 'PAID') return;
    const interval = setInterval(async () => {
      const { data: b } = await supabase.from('bookings').select('payment_status, status').eq('booking_code', bookingCode).maybeSingle();
      if (b && (b.payment_status === 'DEPOSIT_PAID' || b.payment_status === 'PAID')) { fetchBooking(); clearInterval(interval); }
    }, 5000);
    return () => clearInterval(interval);
  }, [booking?.payment_status, bookingCode, fetchBooking]);

  const handlePrint = () => window.print();
  const handleCopy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); toast({ title: 'Đã sao chép!' }); setTimeout(() => setCopied(false), 2000); }
    catch { toast({ title: 'Không thể sao chép', variant: 'destructive' }); }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!booking) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-center p-4">
      <div>
        <h1 className="font-display text-2xl font-bold mb-2">Không tìm thấy đặt phòng</h1>
        <p className="text-muted-foreground mb-4">Mã "{bookingCode}" không tồn tại.</p>
        <Button onClick={() => navigate('/')}>Về trang chủ</Button>
      </div>
    </div>
  );

  const nights = Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24));
  const roomQty = booking.room_quantity || 1;
  // Multiplier dùng để nhân khi hiển thị (cả 2 bữa = ×2)
  const mealMultiplier = Number(booking.meal_multiplier) || 1;
  const mealTimeRaw: string | null = booking.meal_time || null;
  const mealTimeLabel: string | null =
    booking.meal_time_label ||
    (mealTimeRaw === 'lunch' ? 'Bữa trưa'
      : mealTimeRaw === 'dinner' ? 'Bữa tối'
      : mealTimeRaw === 'both' ? 'Cả 2 bữa (Trưa + Tối)'
      : null);
  const comboTotal = booking.combo_total || combos.reduce((s: number, c: any) => s + (c.price_vnd * c.quantity * (Number(c.meal_multiplier) || 1)), 0);
  const indFoodTotal = booking.individual_food_total || foodItems.reduce((s: number, f: any) => s + (f.price_vnd * f.quantity * (Number(f.meal_multiplier) || 1)), 0);
  const extraSurcharge = booking.extra_person_surcharge || 0;
  const extraCount = booking.extra_person_count || 0;
  const originalPrice = booking.original_price_vnd || booking.total_price_vnd;
  const roomSubtotal = booking.room_subtotal || Math.max(0, originalPrice - comboTotal - indFoodTotal - extraSurcharge);
  const pricePerNight = nights > 0 && roomQty > 0 ? Math.round(roomSubtotal / nights / roomQty) : 0;
  const depositAmount = booking.deposit_amount || Math.round(booking.total_price_vnd * 0.5);
  const remainingAmount = booking.remaining_amount || (booking.total_price_vnd - depositAmount);
  const guestBreakdown = parseGuestBreakdown(booking.guest_notes);
  const roomDetails = Array.isArray(booking.room_details) && booking.room_details.length > 0
    ? booking.room_details
    : [{ room_id: booking.room_id, room_name: booking.rooms?.name_vi || booking.room_id, quantity: roomQty }];
  const roomBreakdown = Array.isArray(booking.room_breakdown) && booking.room_breakdown.length > 0
    ? booking.room_breakdown
    : [{ room_id: booking.room_id, room_name: booking.rooms?.name_vi || booking.room_id, quantity: roomQty, subtotal: roomSubtotal, average_nightly_rate: pricePerNight }];
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
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-card border border-border rounded-xl p-4 print:hidden">
          <p className="font-semibold text-foreground">Đặt phòng thành công!</p>
          <p className="text-sm text-muted-foreground">Chúng tôi sẽ liên hệ xác nhận trong vòng 30 phút.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-card-hover border border-border overflow-hidden print:shadow-none print:border-none">

          {/* 1. THÔNG TIN KHÁCH SẠN */}
          <div className="bg-gold-gradient p-6 text-primary-foreground">
            <h1 className="font-display text-xl font-bold text-center tracking-wide">PHIẾU XÁC NHẬN ĐẶT PHÒNG</h1>
            <p className="text-center text-sm text-primary-foreground/80 mt-0.5">BOOKING CONFIRMATION</p>
            <div className="mt-4 text-sm space-y-1 text-primary-foreground/95">
              <p><strong>Khách sạn:</strong> {HOTEL_NAME}</p>
              <p><strong>Địa chỉ:</strong> <a href={HOTEL_MAP} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">{HOTEL_ADDRESS}</a></p>
              <p><strong>Hotline:</strong> {HOTEL_PHONES}</p>
              <p><strong>Email:</strong> {HOTEL_EMAIL}</p>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-secondary rounded-xl text-center">
                <p className="text-xs text-muted-foreground mb-1">Trạng thái</p>
                <span className={`font-bold px-3 py-1 rounded-full text-xs ${booking.status === 'confirmed' ? 'bg-chart-2/20 text-chart-2' : booking.status === 'cancelled' ? 'bg-destructive/20 text-destructive' : 'bg-chart-4/20 text-chart-4'}`}>
                  {booking.status === 'confirmed' ? 'Đã xác nhận' : booking.status === 'cancelled' ? 'Đã hủy' : 'Chờ xác nhận'}
                </span>
              </div>
              <div className="p-3 bg-secondary rounded-xl text-center">
                <p className="text-xs text-muted-foreground mb-1">Thanh toán</p>
                <span className={`font-bold px-3 py-1 rounded-full text-xs ${isDepositPaid ? 'bg-chart-2/20 text-chart-2' : 'bg-amber-100 text-amber-700'}`}>
                  {isDepositPaid ? 'Đã cọc 50%' : 'Chưa thanh toán'}
                </span>
              </div>
            </div>

            {/* Tải PDF */}
            <DownloadPDFButtons
              bookingId={booking.id}
              bookingCode={booking.booking_code}
              isPaid={isDepositPaid}
            />


            <div>
              <h3 className="font-display font-semibold text-base mb-3 border-b border-border pb-2">Thông tin khách hàng</h3>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Họ tên:</span><span className="font-medium">{booking.guest_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Số điện thoại:</span><span className="font-medium">{booking.guest_phone}</span></div>
                {booking.guest_email && <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span className="font-medium">{booking.guest_email}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Nhận phòng:</span><span className="font-medium">{format(new Date(booking.check_in), 'EEEE, dd/MM/yyyy', { locale: vi })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Trả phòng:</span><span className="font-medium">{format(new Date(booking.check_out), 'EEEE, dd/MM/yyyy', { locale: vi })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Số đêm / phòng / khách:</span><span className="font-medium">{nights} đêm · {roomQty} phòng · {guestBreakdown.adults > 0 ? `${guestBreakdown.adults} người lớn` : `${booking.guests_count} khách`}</span></div>
                {guestBreakdown.children > 0 && (
                  <div className="flex justify-between gap-4"><span className="text-muted-foreground">Ghi chú trẻ em:</span><span className="font-medium text-right">{guestBreakdown.children} trẻ em đính kèm (không tính tiền)</span></div>
                )}
              </div>
              {booking.company_name && (
                <div className="mt-3 bg-secondary/50 rounded-lg p-3 space-y-1 text-xs">
                  <p><strong>Công ty:</strong> {booking.company_name}</p>
                  {booking.group_size && <p><strong>Số người:</strong> {booking.group_size}</p>}
                  {booking.special_services && <p><strong>Dịch vụ:</strong> {booking.special_services}</p>}
                </div>
              )}
            </div>

            {/* 3. TỔNG HÓA ĐƠN */}
            <div className="bg-primary/5 border-2 border-primary/30 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground text-base">TỔNG HÓA ĐƠN:</span>
                <span className="font-display font-bold text-primary text-2xl">{fmt(booking.total_price_vnd)}</span>
              </div>
              {hasDiscount && (
                <p className="text-xs text-muted-foreground mt-1 text-right">Giá gốc: <span className="line-through">{fmt(originalPrice)}</span></p>
              )}
            </div>

            {/* 4. TỔNG KHUYẾN MÃI */}
            {hasDiscount && (
              <div className="bg-chart-2/5 border border-chart-2/30 rounded-xl p-4">
                <h3 className="font-display font-semibold text-base mb-3">Tổng khuyến mãi</h3>
                <div className="space-y-1.5 text-sm">
                  {memberDiscount > 0 && (
                    <div className="flex justify-between"><span>Giảm thành viên ({booking.member_discount_percent}%)</span><span className="font-bold text-chart-2">-{fmt(memberDiscount)}</span></div>
                  )}
                  {promotionDiscount > 0 && (
                    <div className="flex justify-between"><span>{booking.promotion_name || 'Ưu đãi'} ({booking.promotion_discount_percent}%)</span><span className="font-bold text-chart-2">-{fmt(promotionDiscount)}</span></div>
                  )}
                  {booking.discount_code && (
                    <div className="flex justify-between">
                      <span>Mã <strong>{booking.discount_code}</strong>{booking.discount_code_type === 'percent' ? ` (${booking.discount_code_value}%)` : ''}</span>
                      <span className="font-bold text-chart-2">{discountCodeAmt > 0 ? `-${fmt(discountCodeAmt)}` : 'Đã áp dụng'}</span>
                    </div>
                  )}
                  {totalDiscount > 0 && (
                    <div className="flex justify-between border-t border-chart-2/30 pt-2 mt-2">
                      <span className="font-bold">Tổng tiết kiệm:</span>
                      <span className="font-bold text-chart-2 text-base">{fmt(totalDiscount)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. CỌC & THANH TOÁN */}
            <div className="bg-secondary rounded-xl p-4 space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Tiền cọc (50%):</span><span className={`font-bold ${isDepositPaid ? 'text-chart-2' : 'text-amber-600'}`}>{fmt(depositAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Đã thanh toán:</span><span className={`font-semibold ${isDepositPaid ? 'text-chart-2' : ''}`}>{isDepositPaid ? fmt(depositAmount) : '0₫'}</span></div>
              <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground font-semibold">Còn lại khi nhận phòng:</span><span className="font-bold text-primary">{isDepositPaid ? fmt(remainingAmount) : fmt(booking.total_price_vnd)}</span></div>
            </div>

            {/* QR CHUYỂN KHOẢN */}
            {!isDepositPaid && (
              <div className="border-2 border-dashed border-amber-400 rounded-xl p-5 bg-amber-50 print:border-amber-300">
                <h3 className="font-display font-semibold text-base mb-4 text-center text-amber-900">THANH TOÁN ĐẶT CỌC</h3>
                <div className="bg-white rounded-lg p-4 mb-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Ngân hàng:</span><span className="font-bold">{VA_BANK}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Số tài khoản (VA):</span><span className="font-bold">{VA_ACCOUNT}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Chủ tài khoản:</span><span className="font-bold">{VA_HOLDER}</span></div>
                </div>
                <div className="flex justify-center mb-4">
                  <img src={qrUrl} alt="QR Thanh toán" className="w-64 rounded-lg shadow-md bg-white" />
                </div>
                <div className="text-center space-y-3">
                  <div>
                    <p className="text-xs text-amber-700 font-semibold uppercase">Nội dung chuyển khoản</p>
                    <p className="font-display text-xl font-bold text-primary tracking-widest mt-1">{booking.booking_code}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => handleCopy(booking.booking_code)}>
                      {copied ? 'Đã sao chép' : 'Sao chép'}
                    </Button>
                  </div>
                  <div>
                    <p className="text-xs text-amber-700 font-semibold uppercase">Số tiền cần chuyển</p>
                    <p className="text-2xl font-bold text-destructive mt-1">{fmt(depositAmount)}</p>
                  </div>
                </div>
                <p className="text-xs text-amber-700 text-center mt-3">Quét QR để tự điền số tiền và nội dung. Trạng thái sẽ tự động cập nhật.</p>
              </div>
            )}

            {isDepositPaid && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-chart-2/10 border border-chart-2/30 rounded-xl p-4 text-center">
                <p className="font-bold text-chart-2 text-lg">Đã cọc 50% thành công!</p>
                <p className="text-sm text-muted-foreground mt-1">Số tiền còn lại {fmt(remainingAmount)} thanh toán khi nhận phòng</p>
              </motion.div>
            )}

            {/* 6. CHI TIẾT ĐẶT PHÒNG */}
            <div>
              <h3 className="font-display font-semibold text-base mb-3 border-b-2 border-primary/30 pb-2">Chi tiết đặt phòng</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-muted-foreground">Loại phòng:</span>
                  <div className="text-right space-y-1">
                    {roomDetails.map((room: any, index: number) => (
                      <p key={`${room.room_id || room.room_name}-${index}`} className="font-semibold">{room.room_name || room.room_id} × {room.quantity || 1} phòng</p>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 bg-secondary/70 rounded-lg p-3 space-y-3">
                {roomBreakdown.map((room: any, index: number) => {
                  const quantity = room.quantity || 1;
                  const subtotal = room.subtotal || 0;
                  // Tự tính lại giá / đêm từ subtotal để đảm bảo đúng kể cả khi
                  // bản ghi cũ lưu sai (ví dụ: lưu tổng cả kỳ vào average_nightly_rate)
                  const computedNightly = nights > 0 && quantity > 0 ? Math.round(subtotal / (nights * quantity)) : 0;
                  const storedNightly = Number(room.average_nightly_rate) || 0;
                  // Nếu giá trị lưu × đêm × phòng KHÔNG khớp subtotal → dùng giá trị tự tính
                  const isStoredValid = storedNightly > 0 && Math.abs(storedNightly * nights * quantity - subtotal) <= Math.max(2, subtotal * 0.01);
                  const nightlyRate = isStoredValid ? storedNightly : computedNightly;
                  return (
                    <div key={`${room.room_id || room.room_name}-${index}`} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold"><span className="text-foreground">{room.room_name || room.room_id}</span><span>{fmt(subtotal)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Giá / đêm:</span><span className="font-medium">{fmt(nightlyRate)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Tính:</span><span className="font-medium">{fmt(nightlyRate)} × {nights} đêm × {quantity} phòng</span></div>
                    </div>
                  );
                })}
                {roomBreakdown.length > 1 && (
                  <div className="flex justify-between font-semibold text-sm border-t border-border pt-1"><span className="text-muted-foreground">Tổng tiền phòng:</span><span>{fmt(roomSubtotal)}</span></div>
                )}
              </div>

              {extraCount > 0 && extraSurcharge > 0 && (
                <div className="mt-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-amber-800 dark:text-amber-300">Phụ thu thêm {extraCount} người</span>
                    <span className="font-bold text-amber-700">+{fmt(extraSurcharge)}</span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">30% giá phòng × {extraCount} người vượt tiêu chuẩn</p>
                </div>
              )}

              {/* Badge bữa ăn */}
              {mealTimeLabel && (combos.length > 0 || foodItems.length > 0) && (
                <div className="mt-4 bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">🍽️ Bữa ăn đã chọn:</span>
                  <span className="text-sm font-bold text-primary">{mealTimeLabel}{mealMultiplier > 1 ? ` (×${mealMultiplier} giá)` : ''}</span>
                </div>
              )}

              {/* Combo */}
              {(combos.length > 0 || booking.combo_notes) && (
                <div className="mt-4">
                  <p className="font-semibold text-sm mb-2">Suất ăn (Combo)</p>
                  <div className="space-y-3">
                    {combos.length > 0 ? combos.map((c: any, idx: number) => {
                      const parts = c.combo_name?.split(' – ') || [c.combo_name];
                      const packageName = c.combo_package_name || parts[0] || '';
                      const menuName = c.combo_menu_name || (parts.length > 1 ? parts.slice(1).join(' – ') : '');
                      const dishes = comboDishes[c.id] || [];
                      const itemMultiplier = Number(c.meal_multiplier) || 1;
                      const itemMealTime = c.meal_time || mealTimeRaw;
                      const itemMealLabel = itemMealTime === 'lunch' ? 'Bữa trưa'
                        : itemMealTime === 'dinner' ? 'Bữa tối'
                        : itemMealTime === 'both' ? 'Cả 2 bữa' : null;
                      const comboItemTotal = c.price_vnd * c.quantity * itemMultiplier;
                      const isAgreed = c.price_vnd === 0;
                      return (
                        <div key={c.id} className="bg-secondary/50 rounded-xl p-3 border border-border/50">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <p className="font-semibold text-sm">{idx + 1}. {packageName}</p>
                              {menuName && <p className="text-xs text-primary mt-0.5">{menuName}</p>}
                              {itemMealLabel && (
                                <p className="text-xs text-amber-700 font-semibold mt-0.5">🕐 {itemMealLabel}{itemMultiplier > 1 ? ` (×${itemMultiplier})` : ''}</p>
                              )}
                            </div>
                            {isAgreed ? <span className="text-xs font-bold text-orange-600">Giá thỏa thuận</span> : <span className="font-bold text-primary text-sm">{fmt(comboItemTotal)}</span>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {isAgreed
                              ? `${c.quantity} suất · Liên hệ NH trước khi đến`
                              : `${fmt(c.price_vnd)}/người × ${c.quantity} suất${itemMultiplier > 1 ? ` × ${itemMultiplier} bữa = ${fmt(comboItemTotal)}` : ''}`}
                          </p>
                          {dishes.length > 0 && (
                            <div className="mt-2 border-t border-border/50 pt-2">
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Thực đơn ({dishes.length} món):</p>
                              {dishes.map((dish: any, i: number) => (
                                <p key={i} className="text-xs text-muted-foreground pl-2">{i + 1}. {dish.name_vi}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }) : (
                      <div className="bg-secondary/50 rounded-xl p-3 border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Chi tiết suất ăn đã chọn:</p>
                        <div className="text-sm whitespace-pre-line leading-6">{booking.combo_notes}</div>
                      </div>
                    )}
                  </div>
                  {comboTotal > 0 && (
                    <div className="bg-secondary/70 rounded-lg p-3 mt-2 flex justify-between font-semibold text-sm">
                      <span className="text-muted-foreground">Tổng combo ({combos.length > 0 ? combos.reduce((s: number, c: any) => s + c.quantity, 0) : 'đã chọn'} suất{mealMultiplier > 1 ? ` × ${mealMultiplier} bữa` : ''}):</span>
                      <span className="text-primary">{fmt(comboTotal)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Food items */}
              {foodItems.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold text-sm mb-2">Món ăn đặt riêng</p>
                  <div className="space-y-1.5">
                    {foodItems.map((f: any, i: number) => {
                      const isAgreed = f.price_vnd === 0;
                      const itemMultiplier = Number(f.meal_multiplier) || 1;
                      const itemMealTime = f.meal_time || mealTimeRaw;
                      const itemMealLabel = itemMealTime === 'lunch' ? 'Trưa'
                        : itemMealTime === 'dinner' ? 'Tối'
                        : itemMealTime === 'both' ? 'Trưa+Tối' : null;
                      const lineTotal = f.price_vnd * f.quantity * itemMultiplier;
                      return (
                        <div key={f.id} className="flex justify-between items-center text-sm bg-secondary/50 rounded-lg px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{i + 1}. {f.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {isAgreed ? `×${f.quantity} · Giá thỏa thuận` : `×${f.quantity} · ${fmt(f.price_vnd)}/món`}
                              {itemMealLabel && itemMultiplier > 1 ? ` · ${itemMealLabel} ×${itemMultiplier}` : itemMealLabel ? ` · ${itemMealLabel}` : ''}
                            </span>
                          </div>
                          {isAgreed ? <span className="text-xs font-bold text-orange-600">Liên hệ NH</span> : <span className="font-bold text-primary">{fmt(lineTotal)}</span>}
                        </div>
                      );
                    })}
                  </div>
                  {indFoodTotal > 0 && (
                    <div className="bg-secondary/70 rounded-lg p-3 mt-2 flex justify-between font-semibold text-sm">
                      <span className="text-muted-foreground">Tổng món riêng{mealMultiplier > 1 ? ` (× ${mealMultiplier} bữa)` : ''}:</span>
                      <span className="text-primary">{fmt(indFoodTotal)}</span>
                    </div>
                  )}
                </div>
              )}

              {(combos.some(c => c.price_vnd === 0) || foodItems.some(f => f.price_vnd === 0)) && (
                <p className="text-xs text-orange-600 mt-2 italic">* Món "Giá thỏa thuận" chưa cộng vào tổng. Vui lòng liên hệ nhà hàng: {HOTEL_PHONES}</p>
              )}
            </div>

            {guestBreakdown.cleanedNotes && (
              <div>
                <h3 className="font-display font-semibold text-base mb-2 border-b border-border pb-2">Ghi chú</h3>
                <p className="text-muted-foreground bg-secondary rounded-lg p-3 text-sm whitespace-pre-line">{guestBreakdown.cleanedNotes}</p>
              </div>
            )}

            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Thời gian đặt: {format(new Date(booking.created_at), 'HH:mm - EEEE, dd/MM/yyyy', { locale: vi })}</p>
            </div>

            <div className="flex flex-wrap gap-3 print:hidden pt-4 border-t border-border">
              <Button variant="gold" onClick={handlePrint}>In / Tải hóa đơn</Button>
              <Button variant="outline" onClick={() => navigate('/')}>Về trang chủ</Button>
            </div>

            <div className="text-center text-xs text-muted-foreground pt-4">
              <p>Cảm ơn quý khách đã tin tưởng <strong className="text-primary">{HOTEL_NAME}</strong>!</p>
              <p className="mt-1">Hotline: {HOTEL_PHONES}</p>
              <p>{HOTEL_EMAIL}</p>
              <p className="mt-1"><a href={HOTEL_MAP} target="_blank" rel="noopener noreferrer" className="text-primary underline">Xem bản đồ →</a></p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default InvoicePage;
