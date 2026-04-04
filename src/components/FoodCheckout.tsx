import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useMenuItems } from '@/hooks/useMenuItems';
import { ArrowLeft, UtensilsCrossed, Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface FoodCheckoutProps {
  onBack: () => void;
}

const FoodCheckout = ({ onBack }: FoodCheckoutProps) => {
  const { language, formatPrice } = useLanguage();
  const { items: cartItems, totalAmount, updateQuantity, removeItem, clearCart, addItem } = useCart();
  const { popularItems } = useMenuItems();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isVi = language === 'vi';

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    roomNumber: '',
    bookingCode: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const getName = (item: { name_vi: string; name_en: string }) => isVi ? item.name_vi : item.name_en;

  const depositAmount = Math.round(totalAmount * 0.5);

  const handleSubmit = async () => {
    if (!form.customerName || !form.phone) {
      toast({ title: isVi ? 'Vui lòng nhập tên và SĐT' : 'Please enter name and phone', variant: 'destructive' });
      return;
    }
    if (cartItems.length === 0) {
      toast({ title: isVi ? 'Giỏ hàng trống' : 'Cart is empty', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // Generate food_order_id
      const now = new Date();
      const yy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = form.bookingCode || `TD${yy}${mm}`;

      let suffix = '-FOOD';
      if (form.bookingCode) {
        const { count } = await supabase
          .from('food_orders')
          .select('*', { count: 'exact', head: true })
          .eq('booking_code', form.bookingCode);
        if (count && count > 0) {
          suffix = `-FOOD-${count + 1}`;
        }
      }

      const foodOrderId = form.bookingCode
        ? `${form.bookingCode}${suffix}`
        : `${prefix}F${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}${suffix}`;

      // Insert food order
      const { data: order, error: orderError } = await supabase
        .from('food_orders')
        .insert({
          food_order_id: foodOrderId,
          booking_code: form.bookingCode || null,
          customer_name: form.customerName,
          phone: form.phone,
          guest_email: form.email || null,
          room_number: form.roomNumber || null,
          total_amount: totalAmount,
          paid_amount: 0,
          status: 'pending',
          payment_status: 'PENDING',
          notes: form.notes || null,
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = cartItems.map(item => ({
        food_order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price_vnd: item.price_vnd,
      }));

      const { error: itemsError } = await supabase.from('food_order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Send email (non-blocking)
      const itemsList = cartItems.map(item => ({
        name: isVi ? item.name_vi : item.name_en,
        quantity: item.quantity,
        price: item.price_vnd,
      }));

      supabase.functions.invoke('send-booking-email', {
        body: {
          type: 'food_order',
          food_order: {
            food_order_id: foodOrderId,
            customer_name: form.customerName,
            phone: form.phone,
            guest_email: form.email || null,
            room_number: form.roomNumber || null,
            booking_code: form.bookingCode || null,
            total_amount: totalAmount,
            deposit_amount: depositAmount,
            items: itemsList,
            notes: form.notes || null,
          },
        },
      }).catch(err => console.error('Email error:', err));

      clearCart();
      navigate(`/food-invoice/${foodOrderId}`);
    } catch (err: any) {
      toast({ title: isVi ? 'Lỗi đặt hàng' : 'Order failed', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            {isVi ? 'Quay lại menu' : 'Back to menu'}
          </Button>

          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
            {isVi ? 'Xác nhận đơn hàng' : 'Confirm Order'}
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Order details + Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cart Items */}
              <div className="bg-card rounded-xl border border-border p-4">
                <h2 className="font-display font-semibold text-lg mb-4">
                  {isVi ? 'Đơn hàng của bạn' : 'Your Order'}
                </h2>
                <div className="space-y-3">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <UtensilsCrossed className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{getName(item)}</p>
                        <p className="text-xs text-primary font-bold">{formatPrice(item.price_vnd)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 rounded hover:bg-background">
                          {item.quantity === 1 ? <Trash2 className="h-3.5 w-3.5 text-destructive" /> : <Minus className="h-3.5 w-3.5" />}
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 rounded hover:bg-background">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold w-24 text-right">{formatPrice(item.price_vnd * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-border space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{isVi ? 'Tổng cộng' : 'Total'}</span>
                    <span className="text-primary">{formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isVi ? 'Tiền cọc (50%)' : 'Deposit (50%)'}</span>
                    <span className="font-bold text-amber-600">{formatPrice(depositAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isVi ? 'Còn lại khi nhận' : 'Remaining'}</span>
                    <span className="font-bold text-primary">{formatPrice(totalAmount - depositAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                <h2 className="font-display font-semibold text-lg">
                  {isVi ? 'Thông tin khách' : 'Guest Information'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{isVi ? 'Họ tên *' : 'Full name *'}</Label>
                    <Input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{isVi ? 'Số điện thoại *' : 'Phone *'}</Label>
                    <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
                  </div>
                  <div>
                    <Label>{isVi ? 'Số phòng' : 'Room number'}</Label>
                    <Input value={form.roomNumber} onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))} placeholder="VD: 301" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{isVi ? 'Mã đặt phòng (nếu có)' : 'Booking code (optional)'}</Label>
                    <Input value={form.bookingCode} onChange={e => setForm(f => ({ ...f, bookingCode: e.target.value.toUpperCase() }))} placeholder="VD: TD202604A00025" />
                  </div>
                </div>
                <div>
                  <Label>{isVi ? 'Ghi chú' : 'Notes'}</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                </div>
              </div>
            </div>

            {/* Right: Summary + Upsell */}
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-card rounded-xl border border-border p-4 sticky top-32">
                <h3 className="font-display font-semibold mb-3">{isVi ? 'Tóm tắt' : 'Summary'}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isVi ? 'Tổng tiền' : 'Total'}</span>
                    <span className="font-bold">{formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isVi ? 'Cọc 50%' : 'Deposit 50%'}</span>
                    <span className="font-bold text-amber-600">{formatPrice(depositAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isVi ? 'Còn lại' : 'Remaining'}</span>
                    <span className="font-bold">{formatPrice(totalAmount - depositAmount)}</span>
                  </div>
                </div>

                <div className="mt-3 p-2 bg-amber-50 rounded-lg text-xs text-amber-700 text-center">
                  {isVi ? '💳 Sau khi đặt, bạn sẽ được chuyển đến trang thanh toán QR cọc 50%' : '💳 After ordering, you will be redirected to QR payment for 50% deposit'}
                </div>

                <Button
                  variant="gold"
                  className="w-full mt-4 py-6 text-base"
                  disabled={submitting || cartItems.length === 0}
                  onClick={handleSubmit}
                >
                  {submitting
                    ? (isVi ? 'Đang xử lý...' : 'Processing...')
                    : (isVi ? 'Xác nhận đặt hàng' : 'Confirm Order')}
                </Button>
              </div>

              {/* Upsell */}
              {popularItems.filter(p => !cartItems.some(c => c.id === p.id)).length > 0 && (
                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="font-display font-semibold mb-3">
                    🔥 {isVi ? 'Gợi ý thêm món' : 'Recommended'}
                  </h3>
                  <div className="space-y-2">
                    {popularItems.filter(p => !cartItems.some(c => c.id === p.id)).slice(0, 5).map(item => (
                      <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                            <UtensilsCrossed className="h-4 w-4 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{getName(item)}</p>
                          <p className="text-xs text-primary font-bold">{formatPrice(item.price_vnd)}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs shrink-0"
                          onClick={() => addItem({
                            id: item.id,
                            name_vi: item.name_vi,
                            name_en: item.name_en,
                            price_vnd: item.price_vnd,
                            image_url: item.image_url,
                          })}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FoodCheckout;
