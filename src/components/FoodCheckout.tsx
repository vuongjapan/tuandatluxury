import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DiscountCodeInput from '@/components/DiscountCodeInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useMenuItems } from '@/hooks/useMenuItems';
import { type DiscountCode } from '@/hooks/usePromotionSystem';
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
  const [appliedDiscounts, setAppliedDiscounts] = useState<DiscountCode[]>([]);

  const getName = (item: { name_vi: string; name_en: string }) => isVi ? item.name_vi : item.name_en;

  // Multi-voucher: sum all applied codes (food orders only count food-applicable codes).
  const discountCodeAmount = appliedDiscounts.reduce((sum, c) => {
    if (c.applies_to === 'room') return sum;
    const amt = c.discount_type === 'percent'
      ? Math.round(totalAmount * c.discount_value / 100)
      : Math.min(c.discount_value, totalAmount);
    return sum + amt;
  }, 0);
  const cappedDiscount = Math.min(discountCodeAmount, totalAmount);
  const finalAmount = totalAmount - cappedDiscount;
  const depositAmount = Math.round(finalAmount * 0.5);

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

      // Determine base code for food order ID
      const baseCode = form.bookingCode || `${prefix}A${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

      // Count existing food orders for this base code
      const { count } = await supabase
        .from('food_orders')
        .select('*', { count: 'exact', head: true })
        .ilike('food_order_id', `${baseCode}FOOD%`);

      // Format: TD202604A00025FOOD, TD202604A00025FOOD1, TD202604A00025FOOD2...
      const foodOrderId = count && count > 0
        ? `${baseCode}FOOD${count}`
        : `${baseCode}FOOD`;

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
          total_amount: finalAmount,
          original_amount: totalAmount,
          discount_code: appliedDiscounts.length > 0 ? appliedDiscounts.map(c => c.code).join(',') : null,
          discount_type: appliedDiscounts.length === 1 ? appliedDiscounts[0].discount_type : (appliedDiscounts.length > 1 ? 'mixed' : null),
          discount_value: appliedDiscounts.length === 1 ? appliedDiscounts[0].discount_value : 0,
          discount_amount: cappedDiscount,
          paid_amount: 0,
          status: 'pending',
          payment_status: 'PENDING',
          notes: form.notes || null,
        } as any)
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
                        <PriceDisplay price={(item as any).price_vnd} priceType={(item as any).price_type} className="text-xs text-primary font-bold inline-block" />
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
                      <span className="text-sm font-bold w-24 text-right">
                        {(item as any).price_type === 'negotiable' || (item as any).price_vnd === 0
                          ? <span className="text-[11px] text-orange-600">{isVi ? 'Tính tại NH' : 'At venue'}</span>
                          : formatPrice((item as any).price_vnd * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-border space-y-2">
                  {cappedDiscount > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{isVi ? 'Tạm tính' : 'Subtotal'}</span>
                        <span className="font-medium line-through text-muted-foreground">{formatPrice(totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-primary">
                        <span>{appliedDiscounts.length === 1 ? `Mã ${appliedDiscounts[0].code}` : `${appliedDiscounts.length} ${isVi ? 'mã' : 'codes'}`}</span>
                        <span>-{formatPrice(cappedDiscount)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span>{isVi ? 'Tổng cộng' : 'Total'}</span>
                    <span className="text-primary">{formatPrice(finalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isVi ? 'Tiền cọc (50%)' : 'Deposit (50%)'}</span>
                    <span className="font-bold text-amber-600">{formatPrice(depositAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isVi ? 'Còn lại khi nhận' : 'Remaining'}</span>
                    <span className="font-bold text-primary">{formatPrice(finalAmount - depositAmount)}</span>
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
                  {cappedDiscount > 0 ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{isVi ? 'Tạm tính' : 'Subtotal'}</span>
                        <span className="font-medium line-through text-muted-foreground">{formatPrice(totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-primary">
                        <span>{appliedDiscounts.length === 1 ? `Mã ${appliedDiscounts[0].code}` : `${appliedDiscounts.length} ${isVi ? 'mã' : 'codes'}`}</span>
                        <span>-{formatPrice(cappedDiscount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{isVi ? 'Tổng tiền' : 'Total'}</span>
                        <span className="font-bold">{formatPrice(finalAmount)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isVi ? 'Tổng tiền' : 'Total'}</span>
                      <span className="font-bold">{formatPrice(totalAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isVi ? 'Cọc 50%' : 'Deposit 50%'}</span>
                    <span className="font-bold text-amber-600">{formatPrice(depositAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isVi ? 'Còn lại' : 'Remaining'}</span>
                    <span className="font-bold">{formatPrice(finalAmount - depositAmount)}</span>
                  </div>
                </div>

                {/* Multi-voucher input */}
                <div className="mt-3 pt-3 border-t border-border">
                  <DiscountCodeInput
                    orderType="food"
                    orderAmount={totalAmount}
                    appliedCodes={appliedDiscounts}
                    onAdd={(d) => setAppliedDiscounts(prev => [...prev, d])}
                    onRemoveCode={(code) => setAppliedDiscounts(prev => prev.filter(c => c.code !== code))}
                  />
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
                          <PriceDisplay price={(item as any).price_vnd} priceType={(item as any).price_type} className="text-xs text-primary font-bold inline-block" />
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
