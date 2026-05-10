import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Minus, Plus, CheckCircle2 } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
}

const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ';

export default function PoolOrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ guest_name: '', guest_phone: '', room_number: '', seat_location: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [doneCode, setDoneCode] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await (supabase as any)
        .from('pool_menu_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      setItems(data || []);
    })();
  }, [open]);

  const total = useMemo(
    () => items.reduce((s, it) => s + (qty[it.id] || 0) * it.price, 0),
    [items, qty]
  );
  const grouped = useMemo(() => {
    const m: Record<string, Item[]> = {};
    items.forEach((i) => {
      (m[i.category] ||= []).push(i);
    });
    return m;
  }, [items]);

  const inc = (id: string, d: number) =>
    setQty((p) => ({ ...p, [id]: Math.max(0, (p[id] || 0) + d) }));

  const submit = async () => {
    if (total === 0) {
      toast.error('Vui lòng chọn ít nhất 1 món');
      return;
    }
    if (!form.guest_phone) {
      toast.error('Vui lòng nhập SĐT để phục vụ liên hệ');
      return;
    }
    setSubmitting(true);
    try {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const { count } = await (supabase as any)
        .from('pool_orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfDay);
      const order_code = `HB${dd}${mm}${String((count || 0) + 1).padStart(3, '0')}`;
      const orderItems = items
        .filter((i) => qty[i.id])
        .map((i) => ({ id: i.id, name: i.name, price: i.price, qty: qty[i.id] }));
      const { error } = await (supabase as any).from('pool_orders').insert({
        order_code,
        ...form,
        items: orderItems,
        total,
      });
      if (error) throw error;
      setDoneCode(order_code);
    } catch (e: any) {
      toast.error(e.message || 'Lỗi gửi đơn');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setQty({});
    setForm({ guest_name: '', guest_phone: '', room_number: '', seat_location: '', notes: '' });
    setDoneCode(null);
  };

  const CAT_LABEL: Record<string, string> = { drink: '🍹 ĐỒ UỐNG', snack: '🍿 SNACK' };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">🍹 Menu Hồ Bơi</DialogTitle>
          <p className="text-xs text-muted-foreground">Phục vụ tận nơi · Thanh toán khi nhận</p>
        </DialogHeader>

        {doneCode ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">Mã đơn của bạn:</p>
            <p className="text-3xl font-bold text-primary tracking-wider mb-4">{doneCode}</p>
            <p className="text-sm text-muted-foreground mb-6">Phục vụ sẽ mang đồ đến vị trí của bạn trong vài phút.</p>
            <Button onClick={() => { reset(); onClose(); }} className="w-full">Đóng</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([cat, list]) => (
              <div key={cat}>
                <h4 className="text-xs font-bold text-muted-foreground tracking-wider mb-2">{CAT_LABEL[cat] || cat.toUpperCase()}</h4>
                <div className="space-y-2">
                  {list.map((it) => (
                    <div key={it.id} className="flex items-center justify-between gap-2 py-2 border-b border-border">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{it.name}</p>
                        <p className="text-xs text-primary font-semibold">{fmt(it.price)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => inc(it.id, -1)}><Minus className="h-3 w-3" /></Button>
                        <span className="w-6 text-center text-sm font-semibold">{qty[it.id] || 0}</span>
                        <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => inc(it.id, 1)}><Plus className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <Label className="text-xs">Vị trí/Ghế số</Label>
                <Input value={form.seat_location} onChange={(e) => setForm({ ...form, seat_location: e.target.value })} placeholder="VD: Ghế 12" />
              </div>
              <div>
                <Label className="text-xs">Số phòng</Label>
                <Input value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Họ tên</Label>
                <Input value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">SĐT *</Label>
                <Input value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} required />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Ghi chú</Label>
                <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center justify-between bg-secondary p-3 rounded-lg sticky bottom-0">
              <span className="font-semibold">Tổng:</span>
              <span className="text-lg font-bold text-primary">{fmt(total)}</span>
            </div>
            <Button onClick={submit} disabled={submitting || total === 0} className="w-full font-bold py-5">
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang gửi...</> : '✅ Gọi phục vụ ngay'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
