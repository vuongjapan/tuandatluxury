import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Check, X, Eye, CheckCircle2 } from 'lucide-react';
import { MediaManager } from './AdminPool';

interface Reservation { id: string; reservation_code: string; guest_name: string; guest_phone: string; guest_email: string | null; room_number: string | null; reservation_date: string; reservation_time: string; num_people: number; special_requests: string[] | null; notes: string | null; status: string; created_at: string; }

const STATUS_LABEL: Record<string, string> = { pending: 'Chờ', confirmed: 'Đã xác nhận', completed: 'Hoàn thành', cancelled: 'Huỷ' };
const STATUS_COLOR: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-green-100 text-green-800', completed: 'bg-blue-100 text-blue-800', cancelled: 'bg-red-100 text-red-800' };

function ReservationsList() {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Reservation | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('restaurant_reservations').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    await (supabase as any).from('restaurant_reservations').update({ status }).eq('id', id);
    toast.success('Đã cập nhật');
    load();
  };

  const filtered = items.filter((i) => filter === 'all' || i.status === filter);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
          <Button key={s} size="sm" variant={filter === s ? 'default' : 'outline'} onClick={() => setFilter(s)}>
            {s === 'all' ? 'Tất cả' : STATUS_LABEL[s]} ({s === 'all' ? items.length : items.filter((i) => i.status === s).length})
          </Button>
        ))}
      </div>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase"><tr><th className="px-3 py-2 text-left">Mã</th><th className="px-3 py-2 text-left">Khách</th><th className="px-3 py-2">Ngày/Giờ</th><th className="px-3 py-2">Số người</th><th className="px-3 py-2">Trạng thái</th><th></th></tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-secondary/50">
                  <td className="px-3 py-2 font-mono text-xs text-primary">{r.reservation_code}</td>
                  <td className="px-3 py-2">{r.guest_name}<div className="text-xs text-muted-foreground">{r.guest_phone}{r.room_number && ` · P.${r.room_number}`}</div></td>
                  <td className="px-3 py-2 text-xs">{r.reservation_date} · {r.reservation_time}</td>
                  <td className="px-3 py-2 text-center">{r.num_people}</td>
                  <td className="px-3 py-2 text-center"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span></td>
                  <td className="px-3 py-2 flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setSelected(r)}><Eye className="h-3.5 w-3.5" /></Button>
                    {r.status === 'pending' && <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, 'confirmed')} className="text-green-600"><Check className="h-3.5 w-3.5" /></Button>}
                    {r.status === 'confirmed' && <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, 'completed')} className="text-blue-600"><CheckCircle2 className="h-3.5 w-3.5" /></Button>}
                    {r.status !== 'cancelled' && r.status !== 'completed' && <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, 'cancelled')} className="text-destructive"><X className="h-3.5 w-3.5" /></Button>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Chưa có đặt bàn nào</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card max-w-md w-full rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">Đặt bàn {selected.reservation_code}</h3>
            <dl className="space-y-1 text-sm">
              <div><b>Khách:</b> {selected.guest_name} · {selected.guest_phone}</div>
              {selected.guest_email && <div><b>Email:</b> {selected.guest_email}</div>}
              {selected.room_number && <div><b>Phòng:</b> {selected.room_number}</div>}
              <div><b>Ngày/Giờ:</b> {selected.reservation_date} · {selected.reservation_time}</div>
              <div><b>Số người:</b> {selected.num_people}</div>
              {selected.special_requests && selected.special_requests.length > 0 && <div><b>Yêu cầu:</b> {selected.special_requests.join(', ')}</div>}
              {selected.notes && <div><b>Ghi chú:</b> {selected.notes}</div>}
            </dl>
            <Button onClick={() => setSelected(null)} className="w-full mt-4">Đóng</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminRestaurant() {
  const [tab, setTab] = useState<'gallery' | 'reservations'>('gallery');
  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border pb-2">
        <Button size="sm" variant={tab === 'gallery' ? 'default' : 'ghost'} onClick={() => setTab('gallery')}>🖼 Ảnh & Video</Button>
        <Button size="sm" variant={tab === 'reservations' ? 'default' : 'ghost'} onClick={() => setTab('reservations')}>📋 Đặt bàn</Button>
      </div>
      {tab === 'gallery' && <MediaManager venue="restaurant" />}
      {tab === 'reservations' && <ReservationsList />}
    </div>
  );
}
