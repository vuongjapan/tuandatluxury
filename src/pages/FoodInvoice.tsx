import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CircleCheckBig, Download, House, Copy, Clock } from 'lucide-react';
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

  const payAmount = order ? (order.total_amount - order.paid_amount > 0 ? order.total_amount - order.paid_amount : order.total_amount) : 0;

  const qrUrl = order
    ? `https://qr.sepay.vn/img?acc=${VA_ACCOUNT}&bank=${VA_BANK}&amount=${payAmount}&des=${encodeURIComponent(order.food_order_id)}`
    : '';

  useEffect(() => {
    const fetch = async () => {
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
    fetch();

    // Polling for payment status
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
  }, [foodOrderId]);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: isVi ? 'Đã sao chép' : 'Copied' });
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

  const isPaid = order.payment_status === 'DEPOSIT_PAID' || order.payment_status === 'PAID' || order.paid_amount >= order.total_amount;

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
              {isVi ? 'Vui lòng thanh toán để xác nhận đơn hàng.' : 'Please complete payment to confirm.'}
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
            <div className="mt-4 text-sm space-y-1 text-primary-foreground/90">
              <p><strong>{isVi ? 'Khách sạn:' : 'Hotel:'}</strong> Tuấn Đạt Luxury</p>
              <p><strong>Hotline:</strong> 098.441.8811 | 098.661.7939</p>
            </div>
          </div>

          <div className="p-6 space-y-5 text-sm">
            {/* Order ID */}
            <div className="bg-secondary rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                {isVi ? 'Mã đơn hàng' : 'Order ID'}
              </p>
              <p className="font-display text-2xl font-bold text-primary tracking-widest">{order.food_order_id}</p>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
              <span className="font-semibold text-muted-foreground">{isVi ? 'Trạng thái' : 'Status'}</span>
              <span className={`font-bold px-3 py-1 rounded-full text-xs ${isPaid ? 'bg-chart-2/20 text-chart-2' : 'bg-chart-4/20 text-chart-4'}`}>
                {isPaid ? (isVi ? '✓ Đã thanh toán' : '✓ Paid') : (isVi ? '⏳ Chờ thanh toán' : '⏳ Pending')}
              </span>
            </div>

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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isVi ? 'Tổng tiền:' : 'Total:'}</span>
                  <span className="font-bold text-primary text-base">{formatPrice(order.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isVi ? 'Đã thanh toán:' : 'Paid:'}</span>
                  <span className="font-medium">{formatPrice(order.paid_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isVi ? 'Còn lại:' : 'Remaining:'}</span>
                  <span className="font-bold text-primary">{formatPrice(order.total_amount - order.paid_amount)}</span>
                </div>
              </div>
            </div>

            {/* Payment QR - only show if not fully paid */}
            {!isPaid && (
              <div className="print:hidden">
                <h3 className="font-display font-semibold text-base mb-3 border-b border-border pb-2">
                  {isVi ? 'Thanh toán qua QR' : 'Pay via QR'}
                </h3>
                <div className="flex flex-col items-center gap-4">
                  <img src={qrUrl} alt="QR Payment" className="w-52 h-52 rounded-xl border border-border" />
                  <div className="w-full space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-secondary rounded-lg">
                      <span className="text-muted-foreground">{isVi ? 'Ngân hàng:' : 'Bank:'}</span>
                      <span className="font-bold">{VA_BANK}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-secondary rounded-lg">
                      <span className="text-muted-foreground">{isVi ? 'Số TK:' : 'Account:'}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{VA_ACCOUNT}</span>
                        <button onClick={() => copyText(VA_ACCOUNT)} className="text-primary"><Copy className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-secondary rounded-lg">
                      <span className="text-muted-foreground">{isVi ? 'Chủ TK:' : 'Holder:'}</span>
                      <span className="font-bold">{VA_HOLDER}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-secondary rounded-lg">
                      <span className="text-muted-foreground">{isVi ? 'Số tiền:' : 'Amount:'}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">{formatPrice(payAmount)}</span>
                        <button onClick={() => copyText(String(payAmount))} className="text-primary"><Copy className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-secondary rounded-lg">
                      <span className="text-muted-foreground">{isVi ? 'Nội dung CK:' : 'Content:'}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{order.food_order_id}</span>
                        <button onClick={() => copyText(order.food_order_id)} className="text-primary"><Copy className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 p-3 bg-chart-4/10 rounded-lg text-xs text-chart-4">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>{isVi ? 'Hệ thống sẽ tự động xác nhận khi nhận được thanh toán.' : 'Payment will be auto-confirmed.'}</span>
                </div>
              </div>
            )}

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
