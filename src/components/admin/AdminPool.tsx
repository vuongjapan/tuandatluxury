import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Trash2, Plus, Check, X, Eye, ImagePlus, Film } from 'lucide-react';

type AdminVenueType = 'pool' | 'restaurant';

interface Media { id: string; venue_type: string; media_type: string; url: string; caption: string | null; sort_order: number; is_active: boolean; }
interface PoolItem { id: string; name: string; category: string; price: number; image_url: string | null; sort_order: number; is_active: boolean; }
interface PoolOrder { id: string; order_code: string; guest_name: string | null; guest_phone: string | null; room_number: string | null; seat_location: string | null; items: any[]; total: number; notes: string | null; status: string; created_at: string; }
interface PoolReq { id: string; request_code: string; service_types: string[]; event_date: string | null; event_time: string | null; num_people: number | null; guest_name: string; guest_phone: string; room_number: string | null; requirements: string | null; status: string; created_at: string; }
interface Reservation { id: string; reservation_code: string; guest_name: string; guest_phone: string; room_number: string | null; reservation_date: string; reservation_time: string; num_people: number; special_requests: string[]; notes: string | null; status: string; created_at: string; }

const STATUS_LABEL: Record<string, string> = { pending: 'Chờ', confirmed: 'Đã xác nhận', completed: 'Hoàn thành', cancelled: 'Huỷ' };
const STATUS_COLOR: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-green-100 text-green-800', completed: 'bg-blue-100 text-blue-800', cancelled: 'bg-red-100 text-red-800' };

// ============ Shared media gallery editor ============
export function MediaManager({ venue }: { venue: AdminVenueType }) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('venue_media').select('*').eq('venue_type', venue).order('sort_order');
    setMedia(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [venue]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const path = `${venue}/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`;
        const { error: upErr } = await supabase.storage.from('site-assets').upload(path, file, { cacheControl: '3600', upsert: false });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);
        await (supabase as any).from('venue_media').insert({ venue_type: venue, media_type: 'image', url: urlData.publicUrl, sort_order: media.length });
      }
      toast.success('Đã tải ảnh lên');
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const addVideo = async () => {
    if (!videoUrl) return;
    await (supabase as any).from('venue_media').insert({ venue_type: venue, media_type: 'video', url: videoUrl, sort_order: media.length });
    setVideoUrl('');
    toast.success('Đã thêm video');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Xoá?')) return;
    await (supabase as any).from('venue_media').delete().eq('id', id);
    load();
  };

  const toggleActive = async (m: Media) => {
    await (supabase as any).from('venue_media').update({ is_active: !m.is_active }).eq('id', m.id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-xs">Tải ảnh lên (chọn nhiều)</Label>
          <Input type="file" accept="image/*" multiple onChange={(e) => handleUpload(e.target.files)} disabled={uploading} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs">Hoặc thêm link video (YouTube hoặc MP4)</Label>
          <div className="flex gap-2">
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
            <Button onClick={addVideo} type="button"><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {media.map((m) => (
            <div key={m.id} className={`relative border rounded-lg overflow-hidden ${m.is_active ? 'border-border' : 'border-destructive opacity-60'}`}>
              {m.media_type === 'image' ? (
                <img src={m.url} alt="" className="w-full aspect-square object-cover" />
              ) : (
                <div className="w-full aspect-square bg-secondary flex items-center justify-center"><Film className="h-8 w-8 text-muted-foreground" /></div>
              )}
              <div className="p-2 flex justify-between gap-1 bg-card">
                <Button size="sm" variant="ghost" onClick={() => toggleActive(m)}>{m.is_active ? '👁' : '🚫'}</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(m.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
          {media.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">Chưa có media</p>}
        </div>
      )}
    </div>
  );
}

// ============ Pool drink menu ============
function PoolMenuEditor() {
  const [items, setItems] = useState<PoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ name: '', category: 'drink', price: 0 });

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('pool_menu_items').select('*').order('sort_order');
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!draft.name || draft.price <= 0) return toast.error('Nhập tên & giá > 0');
    await (supabase as any).from('pool_menu_items').insert({ ...draft, sort_order: items.length });
    setDraft({ name: '', category: 'drink', price: 0 });
    load();
  };

  const update = async (id: string, patch: Partial<PoolItem>) => {
    if (patch.price !== undefined && patch.price <= 0) return toast.error('Giá phải > 0');
    await (supabase as any).from('pool_menu_items').update(patch).eq('id', id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Xoá món này?')) return;
    await (supabase as any).from('pool_menu_items').delete().eq('id', id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 grid md:grid-cols-4 gap-2">
        <Input placeholder="Tên món" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="border border-input rounded-md px-3 text-sm bg-background">
          <option value="drink">Đồ uống</option>
          <option value="snack">Snack</option>
        </select>
        <Input type="number" placeholder="Giá (đ)" value={draft.price || ''} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
        <Button onClick={add}><Plus className="h-4 w-4 mr-1" /> Thêm</Button>
      </div>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase"><tr><th className="px-3 py-2 text-left">Tên</th><th className="px-3 py-2">Loại</th><th className="px-3 py-2">Giá</th><th className="px-3 py-2">Hiện</th><th></th></tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-border">
                  <td className="px-3 py-2"><Input defaultValue={it.name} onBlur={(e) => e.target.value !== it.name && update(it.id, { name: e.target.value })} /></td>
                  <td className="px-3 py-2 text-center text-xs">{it.category === 'drink' ? '🍹' : '🍿'}</td>
                  <td className="px-3 py-2"><Input type="number" defaultValue={it.price} onBlur={(e) => Number(e.target.value) !== it.price && update(it.id, { price: Number(e.target.value) })} className="w-28" /></td>
                  <td className="px-3 py-2 text-center"><input type="checkbox" checked={it.is_active} onChange={(e) => update(it.id, { is_active: e.target.checked })} /></td>
                  <td className="px-3 py-2"><Button size="sm" variant="ghost" onClick={() => remove(it.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============ Pool orders list ============
function PoolOrdersList() {
  const [items, setItems] = useState<PoolOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PoolOrder | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('pool_orders').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    await (supabase as any).from('pool_orders').update({ status }).eq('id', id);
    toast.success('Đã cập nhật');
    load();
  };

  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;

  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase"><tr><th className="px-3 py-2 text-left">Mã</th><th className="px-3 py-2 text-left">Khách</th><th className="px-3 py-2">Vị trí</th><th className="px-3 py-2">Tổng</th><th className="px-3 py-2">Trạng thái</th><th className="px-3 py-2">Thời gian</th><th></th></tr></thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.id} className="border-t border-border hover:bg-secondary/50">
                <td className="px-3 py-2 font-mono text-xs text-primary">{o.order_code}</td>
                <td className="px-3 py-2">{o.guest_name || '-'}<div className="text-xs text-muted-foreground">{o.guest_phone}</div></td>
                <td className="px-3 py-2 text-xs">{o.seat_location || '-'} {o.room_number && `· P.${o.room_number}`}</td>
                <td className="px-3 py-2 font-semibold text-primary">{o.total.toLocaleString('vi-VN')}đ</td>
                <td className="px-3 py-2 text-center"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span></td>
                <td className="px-3 py-2 text-xs">{new Date(o.created_at).toLocaleString('vi-VN')}</td>
                <td className="px-3 py-2 flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setSelected(o)}><Eye className="h-3.5 w-3.5" /></Button>
                  {o.status === 'pending' && <Button size="sm" variant="ghost" onClick={() => setStatus(o.id, 'completed')} className="text-green-600"><Check className="h-3.5 w-3.5" /></Button>}
                  {o.status !== 'cancelled' && <Button size="sm" variant="ghost" onClick={() => setStatus(o.id, 'cancelled')} className="text-destructive"><X className="h-3.5 w-3.5" /></Button>}
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Chưa có đơn nào</td></tr>}
          </tbody>
        </table>
      </div>
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card max-w-md w-full rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">Chi tiết đơn {selected.order_code}</h3>
            <div className="space-y-2 text-sm">
              {selected.items.map((it: any, i: number) => (
                <div key={i} className="flex justify-between"><span>{it.name} × {it.qty}</span><span className="font-semibold">{(it.price * it.qty).toLocaleString('vi-VN')}đ</span></div>
              ))}
              <div className="flex justify-between pt-2 border-t font-bold"><span>Tổng:</span><span className="text-primary">{selected.total.toLocaleString('vi-VN')}đ</span></div>
              {selected.notes && <p className="pt-2 border-t text-muted-foreground">Ghi chú: {selected.notes}</p>}
            </div>
            <Button onClick={() => setSelected(null)} className="w-full mt-4">Đóng</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Pool special requests ============
function PoolReqList() {
  const [items, setItems] = useState<PoolReq[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('pool_special_requests').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    await (supabase as any).from('pool_special_requests').update({ status }).eq('id', id);
    load();
  };

  if (loading) return <Loader2 className="h-5 w-5 animate-spin" />;
  return (
    <div className="bg-card border border-border rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-secondary text-xs uppercase"><tr><th className="px-3 py-2">Mã</th><th className="px-3 py-2">Khách</th><th className="px-3 py-2">Dịch vụ</th><th className="px-3 py-2">Ngày/Giờ</th><th className="px-3 py-2">Số người</th><th className="px-3 py-2">Trạng thái</th><th></th></tr></thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="px-3 py-2 font-mono text-xs text-primary">{r.request_code}</td>
              <td className="px-3 py-2">{r.guest_name}<div className="text-xs text-muted-foreground">{r.guest_phone}</div></td>
              <td className="px-3 py-2 text-xs">{r.service_types.join(', ')}</td>
              <td className="px-3 py-2 text-xs">{r.event_date} {r.event_time}</td>
              <td className="px-3 py-2 text-center">{r.num_people}</td>
              <td className="px-3 py-2 text-center"><span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span></td>
              <td className="px-3 py-2 flex gap-1">
                {r.status === 'pending' && <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, 'confirmed')} className="text-green-600"><Check className="h-3.5 w-3.5" /></Button>}
                {r.status !== 'cancelled' && <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, 'cancelled')} className="text-destructive"><X className="h-3.5 w-3.5" /></Button>}
              </td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Chưa có yêu cầu</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPool() {
  const [tab, setTab] = useState<'gallery' | 'menu' | 'orders' | 'requests'>('gallery');
  const TABS: [typeof tab, string][] = [
    ['gallery', '🖼 Ảnh & Video'],
    ['menu', '🍹 Menu đồ uống'],
    ['orders', '📋 Đơn gọi đồ'],
    ['requests', '✨ Yêu cầu dịch vụ'],
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map(([k, l]) => (
          <Button key={k} size="sm" variant={tab === k ? 'default' : 'ghost'} onClick={() => setTab(k)}>{l}</Button>
        ))}
      </div>
      {tab === 'gallery' && <MediaManager venue="pool" />}
      {tab === 'menu' && <PoolMenuEditor />}
      {tab === 'orders' && <PoolOrdersList />}
      {tab === 'requests' && <PoolReqList />}
    </div>
  );
}
