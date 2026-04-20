import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, Users } from 'lucide-react';
import { toast } from 'sonner';

interface AuctionItem {
  id: string;
  title_vi: string;
  item_type: string;
  ref_id: string | null;
  image_url: string | null;
  description_vi: string | null;
  list_price: number;
  start_price: number;
  bid_step: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  sort_order: number;
}

const empty: Partial<AuctionItem> = {
  title_vi: '', item_type: 'room', image_url: '', description_vi: '',
  list_price: 0, start_price: 0, bid_step: 50000,
  start_time: new Date().toISOString().slice(0, 16),
  end_time: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
  is_active: true, sort_order: 0,
};

const fmt = (n: number) => (n || 0).toLocaleString('vi-VN') + '₫';

const AdminAuction = () => {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [editing, setEditing] = useState<Partial<AuctionItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'items' | 'bids'>('items');

  const fetchAll = async () => {
    const [{ data: it }, { data: bd }] = await Promise.all([
      supabase.from('auction_items').select('*').order('created_at', { ascending: false }),
      supabase.from('auction_bids').select('*, auction_items(title_vi)').order('created_at', { ascending: false }).limit(200),
    ]);
    setItems((it as AuctionItem[]) || []);
    setBids(bd || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const save = async () => {
    if (!editing?.title_vi) return toast.error('Tên không được trống');
    const payload = {
      ...editing,
      start_time: new Date(editing.start_time as string).toISOString(),
      end_time: new Date(editing.end_time as string).toISOString(),
    };
    const { error } = editing.id
      ? await supabase.from('auction_items').update(payload).eq('id', editing.id)
      : await supabase.from('auction_items').insert(payload as any);
    if (error) return toast.error(error.message);
    toast.success('Đã lưu');
    setEditing(null);
    fetchAll();
  };

  const del = async (id: string) => {
    if (!confirm('Xóa sản phẩm này?')) return;
    const { error } = await supabase.from('auction_items').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Đã xóa');
    fetchAll();
  };

  const toggle = async (item: AuctionItem) => {
    await supabase.from('auction_items').update({ is_active: !item.is_active }).eq('id', item.id);
    fetchAll();
  };

  const uploadImage = async (file: File) => {
    const path = `auction/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('site-assets').upload(path, file);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
    setEditing({ ...editing!, image_url: data.publicUrl });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <Button size="sm" variant={tab === 'items' ? 'default' : 'ghost'} onClick={() => setTab('items')}>Sản phẩm ({items.length})</Button>
          <Button size="sm" variant={tab === 'bids' ? 'default' : 'ghost'} onClick={() => setTab('bids')}>
            <Users className="h-4 w-4 mr-1" /> Khách trả giá ({bids.length})
          </Button>
        </div>
        {tab === 'items' && (
          <Button onClick={() => setEditing({ ...empty })}><Plus className="h-4 w-4 mr-1" />Thêm sản phẩm</Button>
        )}
      </div>

      {loading ? <p className="text-muted-foreground">Đang tải...</p> : tab === 'items' ? (
        <div className="grid gap-3">
          {items.map(item => (
            <div key={item.id} className="bg-card rounded-xl border border-border p-4 flex gap-4">
              {item.image_url && <img src={item.image_url} alt="" className="w-24 h-24 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold">{item.title_vi}</h3>
                  <Badge variant="outline">{item.item_type === 'room' ? 'Phòng' : 'Combo'}</Badge>
                  {item.is_active ? <Badge className="bg-emerald-500">Đang bật</Badge> : <Badge variant="secondary">Đã tắt</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  Niêm yết: <span className="line-through">{fmt(item.list_price)}</span> · Khởi điểm: <span className="font-semibold">{fmt(item.start_price)}</span> · Bước: {fmt(item.bid_step)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.start_time).toLocaleString('vi-VN')} → {new Date(item.end_time).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <Switch checked={item.is_active} onCheckedChange={() => toggle(item)} />
                <div className="flex gap-1">
                  <Button size="icon" variant="outline" onClick={() => setEditing({ ...item, start_time: item.start_time.slice(0, 16), end_time: item.end_time.slice(0, 16) })}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => del(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-center text-muted-foreground py-8">Chưa có sản phẩm nào.</p>}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr><th className="text-left p-3">Khách</th><th className="text-left p-3">SĐT</th><th className="text-left p-3">Sản phẩm</th><th className="text-right p-3">Giá</th><th className="text-left p-3">Thời gian</th></tr>
            </thead>
            <tbody>
              {bids.map((b: any) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="p-3 font-medium">{b.bidder_name}</td>
                  <td className="p-3">{b.bidder_phone}</td>
                  <td className="p-3 text-muted-foreground">{b.auction_items?.title_vi || '—'}</td>
                  <td className="p-3 text-right font-semibold text-primary">{fmt(b.bid_amount)}</td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString('vi-VN')}</td>
                </tr>
              ))}
              {bids.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Chưa có lượt trả giá nào.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? 'Sửa' : 'Thêm'} sản phẩm đấu giá</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Tên sản phẩm</label>
                <Input value={editing.title_vi || ''} onChange={(e) => setEditing({ ...editing, title_vi: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Loại</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={editing.item_type} onChange={(e) => setEditing({ ...editing, item_type: e.target.value })}>
                    <option value="room">Phòng khách sạn</option>
                    <option value="combo">Combo ăn uống/nghỉ dưỡng</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Ảnh</label>
                  <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                </div>
              </div>
              {editing.image_url && <img src={editing.image_url} alt="" className="w-32 h-32 object-cover rounded-lg" />}
              <div>
                <label className="text-sm font-medium">Mô tả ngắn</label>
                <Textarea value={editing.description_vi || ''} onChange={(e) => setEditing({ ...editing, description_vi: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Giá niêm yết</label>
                  <Input type="number" value={editing.list_price || 0} onChange={(e) => setEditing({ ...editing, list_price: +e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Giá khởi điểm</label>
                  <Input type="number" value={editing.start_price || 0} onChange={(e) => setEditing({ ...editing, start_price: +e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Bước giá</label>
                  <Input type="number" value={editing.bid_step || 0} onChange={(e) => setEditing({ ...editing, bid_step: +e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Bắt đầu</label>
                  <Input type="datetime-local" value={editing.start_time as string} onChange={(e) => setEditing({ ...editing, start_time: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Kết thúc</label>
                  <Input type="datetime-local" value={editing.end_time as string} onChange={(e) => setEditing({ ...editing, end_time: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2"><Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /> Bật hiển thị</label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Hủy</Button>
            <Button onClick={save}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAuction;
