import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CircleCheckBig, CheckCircle, Download, House, Copy, Clock, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { vi as viLocale } from 'date-fns/locale';

const VA_BANK = 'BIDV';
const VA_ACCOUNT = '96247TUANDATLUXURY';
const VA_HOLDER = 'VAN DINH GIANG';

interface FoodOrder {
  id: string;
  food_order_id: string;
  booking_code: string | null;
  customer_name: string;
  phone: string;
  room_number: string | null;
  total_amount: number;
  paid_amount: number;
  status: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price_vnd: number;
  menu_items?: {
    name_vi: string;
    name_en: string;
  };
}

const FoodInvoice = () => {
  const { foodOrderId } = useParams();
  const navigate = useNavigate();
  const { language, formatPrice } = useLanguage();
  const { toast } = useToast();
  const isVi = language === 'vi';

  const [order, setOrder] = useState<FoodOrder | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: orderData } = await supabase
        .from('food_orders')
        .select('*')
        .eq('food_order_id', foodOrderId)
        .maybeSingle();

      if (orderData) {
        setOrder(orderData as FoodOrder);
        const { data: items } = await supabase
          .from('food_order_items')
          .select('*, menu_items:menu_item_id(name_vi, name_en)')
          .eq('food_order_id', orderData.id);
        setOrderItems((items as OrderItem[]) || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [foodOrderId]);

  // Polling for payment status
  useEffect(() => {
    if (!order || order.payment_status === 'DEPOSIT_PAID' || order.payment_status === 'PAID') return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('food_orders')
        .select('payment_status, paid_amount, status')
        .eq('food_order_id', foodOrderId)
        .maybeSingle();
      if (data) {
        setOrder(prev => prev ? { ...prev, ...data } : prev);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [order?.payment_status, foodOrderId]);

  const originalAmount = order ? ((order as any).original_amount || order.total_amount) : 0;
  const discountCode = order ? (order as any).discount_code : null;
  const discountAmountVal = order ? ((order as any).discount_amount || 0) : 0;
  const depositAmount = order ? Math.round(order.total_amount * 0.5) : 0;
  const remainingAmount = order ? order.total_amount - depositAmount : 0;
  const isDepositPaid = order ? (order.payment_status === 'DEPOSIT_PAID' || order.payment_status === 'PAID') : false;
  const hasDiscount = discountAmountVal > 0;

  const qrUrl = order
    ? `https://qr.sepay.vn/img?acc=${VA_ACCOUNT}&bank=${VA_BANK}&amount=${depositAmount}&des=${encodeURIComponent(order.food_order_id)}`
    : '';

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: isVi ? 'Đã sao chép' : 'Copied' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: isVi ? 'Không thể sao chép' : 'Cannot copy', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center p-4">
        <div>
          <h1 className="font-display text-2xl font-bold mb-2">
            {isVi ? 'Không tìm thấy đơn hàng' : 'Order not found'}
          </h1>
          <Button onClick={() => navigate('/food-order')}>{isVi ? 'Quay lại' : 'Go back'}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary py-10 px-4 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto">
        {/* Success message */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-card border border-border rounded-xl p-4 flex items-center gap-3 print:hidden"
        >
          <CircleCheckBig className="h-6 w-6 text-primary shrink-0" />
          <div>
            <p className="font-semibold text-foreground">{isVi ? 'Đặt hàng thành công!' : 'Order placed!'}</p>
            <p className="text-sm text-muted-foreground">
              {isVi ? 'Vui lòng thanh toán cọc 50% để xác nhận đơn hàng.' : 'Please pay 50% deposit to confirm your order.'}
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-card-hover border border-border overflow-hidden print:shadow-none print:border-none"
        >
          {/* Header */}
          <div className="bg-gold-gradient p-6 text-primary-foreground">
            <p className="text-center text-lg mb-1">🍽️</p>
            <h1 className="font-display text-xl font-bold text-center tracking-wide">
              {isVi ? 'HÓA ĐƠN ĐẶT ĐỒ ĂN' : 'FOOD ORDER INVOICE'}
            </h1>
            <p className="text-center text-sm text-primary-foreground/80 mt-0.5">FOOD ORDER CONFIRMATION</p>
            <div className="mt-4 text-sm space-y-1 text-primary-foreground/90">
              <p><strong>{isVi ? 'Khách sạn:' : 'Hotel:'}</strong> Tuấn Đạt Luxury</p>
              <p><strong>Hotline:</strong> 098.360.5768 | 036.984.5422 | 098.661.7939</p>
              <p><strong>Email:</strong> tuandatluxuryflc36hotel@gmail.com</p>
            </div>
          </div>

          <div className="p-6 space-y-5 text-sm">
            {/* Order ID */}
            <div className="bg-secondary rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                {isVi ? 'Mã đơn hàng' : 'Order ID'}
              </p>
              <p className="font-display text-2xl font-bold text-primary tracking-widest">{order.food_order_id}</p>
              <p className="text-xs text-muted-foreground mt-1">{isVi ? 'Lưu mã này để tra cứu đơn hàng' : 'Save this code'}</p>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
              <span className="font-semibold text-muted-foreground">{isVi ? 'Trạng thái' : 'Status'}</span>
              <span className={`font-bold px-3 py-1 rounded-full text-xs ${isDepositPaid ? 'bg-chart-2/20 text-chart-2' : 'bg-chart-4/20 text-chart-4'}`}>
                {isDepositPaid ? (isVi ? '✓ Đã xác nhận' : '✓ Confirmed') : (isVi ? '⏳ Chờ xác nhận' : '⏳ Pending')}
              </span>
            </div>

            {/* Payment status */}
            <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
              <span className="font-semibold text-muted-foreground">{isVi ? 'Thanh toán' : 'Payment'}</span>
              <span className={`font-bold px-3 py-1 rounded-full text-xs ${isDepositPaid ? 'bg-chart-2/20 text-chart-2' : 'bg-amber-100 text-amber-700'}`}>
                {isDepositPaid ? (isVi ? '✅ Đã cọc 50%' : '✅ Deposit paid') : (isVi ? '⏳ Chưa thanh toán' : '⏳ Unpaid')}
              </span>
            </div>

            {/* Discount info */}
            {hasDiscount && discountCode && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🎟️</span>
                  <span className="font-semibold text-foreground text-sm">{isVi ? 'Ưu đãi đã áp dụng' : 'Discount Applied'}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isVi ? 'Mã giảm giá' : 'Code'}: <strong>{discountCode}</strong> (-{formatPrice(discountAmountVal)})
                </p>
              </div>
            )}

            {/* Customer Info */}
            <div>
              <h3 className="font-display font-semibold text-base mb-3 border-b border-border pb-2">
                {isVi ? 'Thông tin khách' : 'Guest Info'}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isVi ? 'Họ tên:' : 'Name:'}</span>
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isVi ? 'SĐT:' : 'Phone:'}</span>
                  <span className="font-medium">{order.phone}</span>
                </div>
                {order.room_number && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isVi ? 'Phòng:' : 'Room:'}</span>
                    <span className="font-medium">{order.room_number}</span>
                  </div>
                )}
                {order.booking_code && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isVi ? 'Mã đặt phòng:' : 'Booking:'}</span>
                    <span className="font-medium">{order.booking_code}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-display font-semibold text-base mb-3 border-b border-border pb-2">
                {isVi ? 'Chi tiết đơn hàng' : 'Order Details'}
              </h3>
              <div className="space-y-2">
                {orderItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <span className="font-medium">
                        {isVi ? item.menu_items?.name_vi : item.menu_items?.name_en}
                      </span>
                      <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-medium">{formatPrice(item.price_vnd * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div>
              <h3 className="font-display font-semibold text-base mb-3 border-b border-border pb-2">
                {isVi ? 'Chi phí' : 'Payment'}
              </h3>
              <div className="space-y-2">
                {hasDiscount && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isVi ? 'Tạm tính:' : 'Subtotal:'}</span>
                      <span className="font-medium line-through text-muted-foreground">{formatPrice(originalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-primary">
                      <span>{isVi ? 'Giảm giá:' : 'Discount:'}</span>
                      <span className="font-medium">-{formatPrice(discountAmountVal)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isVi ? 'Tổng tiền:' : 'Total:'}</span>
                  <span className="font-bold text-primary text-base">{formatPrice(order.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isVi ? 'Tiền cọc (50%):' : 'Deposit (50%):'}</span>
                  <span className={`font-bold ${isDepositPaid ? 'text-chart-2' : 'text-amber-600'}`}>{formatPrice(depositAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isVi ? 'Đã thanh toán:' : 'Paid:'}</span>
                  <span className={`font-medium ${isDepositPaid ? 'text-chart-2' : ''}`}>
                    {isDepositPaid ? formatPrice(depositAmount) : '0₫'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isVi ? 'Còn lại:' : 'Remaining:'}</span>
                  <span className="font-bold text-primary">
                    {isDepositPaid ? formatPrice(remainingAmount) : formatPrice(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Payment - only show if not paid */}
            {!isDepositPaid && (
              <div className="border-2 border-dashed border-amber-400 rounded-xl p-5 bg-amber-50 print:border-amber-300">
                <h3 className="font-display font-semibold text-base mb-4 text-center text-amber-900">💳 {isVi ? 'THANH TOÁN ĐẶT CỌC' : 'DEPOSIT PAYMENT'}</h3>
                
                <div className="bg-white rounded-lg p-4 mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">🏦 {isVi ? 'Ngân hàng:' : 'Bank:'}</span>
                    <span className="font-bold">{VA_BANK}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">🔢 {isVi ? 'Số TK (VA):' : 'Account:'}</span>
                    <span className="font-bold">{VA_ACCOUNT}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">👤 {isVi ? 'Chủ TK:' : 'Holder:'}</span>
                    <span className="font-bold">{VA_HOLDER}</span>
                  </div>
                  <p className="text-xs text-amber-700 text-center mt-2">
                    ⚠️ {isVi ? 'Chỉ chuyển khoản qua tài khoản ảo (VA) hoặc quét mã QR bên dưới.' : 'Transfer via VA or scan QR below.'}
                  </p>
                </div>

                <div className="flex justify-center mb-4">
                  <img src={qrUrl} alt="QR Payment" className="w-64 rounded-lg shadow-md bg-white" />
                </div>

                <div className="text-center space-y-3">
                  <div>
                    <p className="text-xs text-amber-700 font-semibold uppercase">📌 {isVi ? 'Nội dung chuyển khoản:' : 'Transfer content:'}</p>
                    <p className="font-display text-xl font-bold text-primary tracking-widest mt-1">{order.food_order_id}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleCopy(order.food_order_id)}
                    >
                      {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                      {copied ? (isVi ? 'Đã sao chép' : 'Copied') : (isVi ? 'Sao chép' : 'Copy')}
                    </Button>
                  </div>
                  <div>
                    <p className="text-xs text-amber-700 font-semibold uppercase">💰 {isVi ? 'Số tiền cần chuyển:' : 'Amount:'}</p>
                    <p className="text-2xl font-bold text-destructive mt-1">{formatPrice(depositAmount)}</p>
                  </div>
                </div>

                <p className="text-xs text-amber-700 text-center mt-3">
                  ⚡ {isVi ? 'Quét QR để tự điền số tiền và nội dung. Trạng thái tự động cập nhật sau chuyển khoản.' : 'Scan QR to auto-fill. Status updates automatically.'}
                </p>
              </div>
            )}

            {/* Deposit paid confirmation */}
            {isDepositPaid && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-chart-2/10 border border-chart-2/30 rounded-xl p-4 text-center"
              >
                <CheckCircle className="h-8 w-8 text-chart-2 mx-auto mb-2" />
                <p className="font-bold text-chart-2 text-lg">{isVi ? 'Đã cọc 50% thành công!' : 'Deposit paid!'}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isVi ? `Số tiền còn lại ${formatPrice(remainingAmount)} thanh toán khi nhận đồ` : `Remaining ${formatPrice(remainingAmount)} on delivery`}
                </p>
              </motion.div>
            )}

            {/* Notes */}
            {order.notes && (
              <div>
                <h3 className="font-display font-semibold text-base mb-3 border-b border-border pb-2">
                  {isVi ? 'Ghi chú' : 'Notes'}
                </h3>
                <p className="text-foreground bg-secondary rounded-lg p-3">{order.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-border pt-4 space-y-3 text-xs text-muted-foreground">
              <p className="text-center">
                {isVi ? 'Xin chân thành cảm ơn Quý khách đã lựa chọn' : 'Thank you for choosing'}{' '}
                <strong className="text-primary">Tuấn Đạt Luxury</strong>.
              </p>
              <div className="text-center pt-2 border-t border-border">
                <p className="font-semibold text-foreground">{isVi ? 'Trân trọng,' : 'Best regards,'}</p>
                <p className="font-semibold text-foreground">Tuấn Đạt Luxury</p>
                <p>📞 098.360.5768 | 036.984.5422 | 098.661.7939</p>
                <p>📧 tuandatluxuryflc36hotel@gmail.com</p>
              </div>
            </div>

            {/* Timestamp */}
            <p className="text-xs text-muted-foreground text-center pt-2">
              {isVi ? 'Thời gian đặt:' : 'Order time:'} {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: viLocale })}
            </p>
          </div>
        </motion.div>

        <div className="mt-4 flex gap-3 print:hidden">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
            <House className="h-4 w-4 mr-2" />{isVi ? 'Về trang chủ' : 'Home'}
          </Button>
          <Button variant="hero" className="flex-1" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />{isVi ? 'In / Tải PDF' : 'Print / PDF'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FoodInvoice;
