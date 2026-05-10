import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, Loader2 } from 'lucide-react';

const SPECIAL = ['Bàn view biển', 'Phòng riêng', 'Bàn sinh nhật', 'Ghế trẻ em'];

export default function RestaurantReservationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    reservation_date: today,
    reservation_time: '19:00',
    num_people: 4,
    guest_name: '',
    guest_phone: '',
    guest_email: '',
    room_number: '',
    notes: '',
  });
  const [special, setSpecial] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [doneCode, setDoneCode] = useState<string | null>(null);

  const toggle = (s: string) =>
    setSpecial((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const submit = async () => {
    if (!form.guest_name || !form.guest_phone) return toast.error('Nhập tên và SĐT');
    setSubmitting(true);
    try {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const { count } = await (supabase as any)
        .from('restaurant_reservations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfDay);
      const reservation_code = `NH${dd}${mm}${String((count || 0) + 1).padStart(3, '0')}`;
      const { error } = await (supabase as any).from('restaurant_reservations').insert({
        reservation_code,
        ...form,
        guest_email: form.guest_email || null,
        room_number: form.room_number || null,
        special_requests: special,
      });
      if (error) throw error;
      setDoneCode(reservation_code);
    } catch (e: any) {
      toast.error(e.message || 'Lỗi đặt bàn');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSpecial([]);
    setDoneCode(null);
    setForm({ reservation_date: today, reservation_time: '19:00', num_people: 4, guest_name: '', guest_phone: '', guest_email: '', room_number: '', notes: '' });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">🍽 Đặt bàn nhà hàng</DialogTitle>
        </DialogHeader>

        {doneCode ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">Mã đặt bàn:</p>
            <p className="text-3xl font-bold text-primary mb-4">{doneCode}</p>
            <p className="text-sm text-muted-foreground mb-6">Nhà hàng sẽ xác nhận với bạn qua điện thoại trong 30 phút.</p>
            <Button onClick={() => { reset(); onClose(); }} className="w-full">Đóng</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Ngày *</Label><Input type="date" value={form.reservation_date} onChange={(e) => setForm({ ...form, reservation_date: e.target.value })} /></div>
              <div><Label className="text-xs">Giờ *</Label><Input type="time" value={form.reservation_time} onChange={(e) => setForm({ ...form, reservation_time: e.target.value })} /></div>
              <div><Label className="text-xs">Số người *</Label><Input type="number" min={1} value={form.num_people} onChange={(e) => setForm({ ...form, num_people: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Số phòng</Label><Input value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} /></div>
              <div><Label className="text-xs">Họ tên *</Label><Input value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} /></div>
              <div><Label className="text-xs">SĐT *</Label><Input value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} /></div>
              <div className="col-span-2"><Label className="text-xs">Email (nhận xác nhận)</Label><Input type="email" value={form.guest_email} onChange={(e) => setForm({ ...form, guest_email: e.target.value })} /></div>
            </div>
            <div>
              <Label className="text-xs">Yêu cầu</Label>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {SPECIAL.map((s) => (
                  <label key={s} className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer text-xs hover:bg-secondary">
                    <input type="checkbox" checked={special.includes(s)} onChange={() => toggle(s)} />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Ghi chú</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button onClick={submit} disabled={submitting} className="w-full font-bold py-5">
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang gửi...</> : 'Đặt bàn ngay →'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
