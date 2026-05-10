import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, Loader2 } from 'lucide-react';

const SERVICE_OPTIONS = [
  'Tiệc nhỏ tại hồ bơi',
  'Sinh nhật / Kỷ niệm',
  'Massage thư giãn',
  'Chụp ảnh chuyên nghiệp',
  'Khác',
];

export default function PoolRequestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [services, setServices] = useState<string[]>([]);
  const [form, setForm] = useState({
    guest_name: '',
    guest_phone: '',
    room_number: '',
    event_date: '',
    event_time: '',
    num_people: 2,
    requirements: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [doneCode, setDoneCode] = useState<string | null>(null);

  const toggle = (s: string) =>
    setServices((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const submit = async () => {
    if (services.length === 0) return toast.error('Chọn ít nhất 1 dịch vụ');
    if (!form.guest_name || !form.guest_phone) return toast.error('Nhập tên và SĐT');
    setSubmitting(true);
    try {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const { count } = await (supabase as any)
        .from('pool_special_requests')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfDay);
      const request_code = `HBR${dd}${mm}${String((count || 0) + 1).padStart(3, '0')}`;
      const { error } = await (supabase as any).from('pool_special_requests').insert({
        request_code,
        service_types: services,
        event_date: form.event_date || null,
        event_time: form.event_time || null,
        num_people: Number(form.num_people) || null,
        guest_name: form.guest_name,
        guest_phone: form.guest_phone,
        room_number: form.room_number || null,
        requirements: form.requirements || null,
      });
      if (error) throw error;
      setDoneCode(request_code);
    } catch (e: any) {
      toast.error(e.message || 'Lỗi gửi yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setServices([]);
    setForm({ guest_name: '', guest_phone: '', room_number: '', event_date: '', event_time: '', num_people: 2, requirements: '' });
    setDoneCode(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">✨ Yêu cầu dịch vụ riêng</DialogTitle>
        </DialogHeader>

        {doneCode ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">Mã yêu cầu:</p>
            <p className="text-3xl font-bold text-primary mb-4">{doneCode}</p>
            <p className="text-sm text-muted-foreground mb-6">Lễ tân sẽ liên hệ với bạn trong vòng 30 phút.</p>
            <Button onClick={() => { reset(); onClose(); }} className="w-full">Đóng</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Loại dịch vụ *</Label>
              <div className="space-y-1 mt-1">
                {SERVICE_OPTIONS.map((s) => (
                  <label key={s} className="flex items-center gap-2 p-2 rounded-md border border-border cursor-pointer text-sm hover:bg-secondary">
                    <input type="checkbox" checked={services.includes(s)} onChange={() => toggle(s)} />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Ngày</Label><Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
              <div><Label className="text-xs">Giờ</Label><Input type="time" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} /></div>
              <div><Label className="text-xs">Số người</Label><Input type="number" min={1} value={form.num_people} onChange={(e) => setForm({ ...form, num_people: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Số phòng</Label><Input value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} /></div>
              <div><Label className="text-xs">Họ tên *</Label><Input value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} /></div>
              <div><Label className="text-xs">SĐT *</Label><Input value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} /></div>
            </div>
            <div>
              <Label className="text-xs">Yêu cầu chi tiết</Label>
              <Textarea rows={3} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
            </div>
            <Button onClick={submit} disabled={submitting} className="w-full font-bold py-5">
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang gửi...</> : 'Gửi yêu cầu →'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
