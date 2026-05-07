import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, Hotel, Utensils, Soup } from 'lucide-react';

type CType = 'hotel' | 'restaurant' | 'eatery';

interface RoomPrice { type: string; min: number; max: number; note?: string }

interface Competitor {
  id: string;
  type: CType;
  name: string;
  address?: string;
  area?: string;
  phone?: string;
  website?: string;
  star_rating?: number;
  room_prices?: RoomPrice[];
  amenities?: string[];
  cuisine_types?: string[];
  price_per_person_min?: number;
  price_per_person_max?: number;
  signature_dishes?: string;
  google_rating?: number;
  google_review_count?: number;
  admin_rating?: number;
  strengths?: string;
  weaknesses?: string;
  notes?: string;
  last_updated?: string;
}

const fmt = (n?: number) => (n || 0).toLocaleString('vi-VN') + 'đ';
const today = () => new Date().toISOString().slice(0, 10);

const TYPE_META: Record<CType, { icon: any; label: string }> = {
  hotel: { icon: Hotel, label: 'Khách sạn' },
  restaurant: { icon: Utensils, label: 'Nhà hàng' },
  eatery: { icon: Soup, label: 'Quán ăn' },
};

const AREAS = ['FLC', 'Trung tâm', 'Bãi biển', 'Khác'];
const HOTEL_AMENITIES = ['Hồ bơi', 'Nhà hàng', 'Spa', 'Bãi xe', 'Phòng gym', 'Bar'];
const CUISINES = ['Hải sản', 'Lẩu', 'Cơm', 'Buffet', 'Chay', 'Đặc sản'];

const empty: Competitor = {
  id: '', type: 'hotel', name: '', room_prices: [], amenities: [], cuisine_types: [],
  last_updated: today(),
};

export default function AdminCompetitorResearch() {
  const { toast } = useToast();
  const [list, setList] = useState<Competitor[]>([]);
  const [filter, setFilter] = useState<CType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Competitor | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await (supabase as any).from('competitor_research').select('*').order('type').order('name');
    setList((data as any) || []);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter(c =>
      (filter === 'all' || c.type === filter) &&
      (!q || c.name.toLowerCase().includes(q))
    );
  }, [list, filter, search]);

  const counts = useMemo(() => ({
    all: list.length,
    hotel: list.filter(c => c.type === 'hotel').length,
    restaurant: list.filter(c => c.type === 'restaurant').length,
    eatery: list.filter(c => c.type === 'eatery').length,
  }), [list]);

  const startNew = () => { setEditing({ ...empty }); setOpen(true); };
  const startEdit = (c: Competitor) => { setEditing({ ...c, room_prices: c.room_prices || [], amenities: c.amenities || [], cuisine_types: c.cuisine_types || [] }); setOpen(true); };
  const remove = async (c: Competitor) => {
    if (!confirm(`Xóa "${c.name}"?`)) return;
    await (supabase as any).from('competitor_research').delete().eq('id', c.id);
    toast({ title: 'Đã xóa' });
    load();
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) { toast({ title: 'Cần tên', variant: 'destructive' }); return; }
    const { id, ...payload } = editing;
    payload.last_updated = payload.last_updated || today();
    const res = id
      ? await (supabase as any).from('competitor_research').update(payload).eq('id', id)
      : await (supabase as any).from('competitor_research').insert(payload);
    if (res.error) { toast({ title: 'Lỗi lưu', description: res.error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Đã lưu' });
    setOpen(false); setEditing(null);
    load();
  };

  // Hotel price comparison data (room_prices min/max)
  const hotelChart = useMemo(() => {
    const items = list
      .filter(c => c.type === 'hotel' && (c.room_prices || []).length > 0)
      .map(c => {
        const all = (c.room_prices || []).flatMap(r => [r.min, r.max].filter(Boolean) as number[]);
        return { name: c.name, min: Math.min(...all), max: Math.max(...all) };
      });
    items.unshift({ name: 'Tuấn Đạt Luxury (TÔI)', min: 499000, max: 700000 });
    const globalMax = Math.max(...items.map(i => i.max), 1);
    return { items, globalMax };
  }, [list]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="font-serif text-2xl">🔍 Nghiên cứu đối thủ Sầm Sơn</h2>
        <Button onClick={startNew} className="gap-2"><Plus className="h-4 w-4" />Thêm mới</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'hotel', 'restaurant', 'eatery'] as const).map(k => (
          <Button key={k} size="sm" variant={filter === k ? 'default' : 'outline'} onClick={() => setFilter(k)}>
            {k === 'all' ? `Tất cả (${counts.all})` : `${TYPE_META[k as CType].label} (${counts[k as CType]})`}
          </Button>
        ))}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Tìm theo tên..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Chart for hotels */}
      {hotelChart.items.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold">📊 So sánh giá phòng — Sầm Sơn</h3>
          <div className="space-y-2">
            {hotelChart.items.map((it, idx) => {
              const isMe = it.name.includes('TÔI');
              const w = (it.max / hotelChart.globalMax) * 100;
              return (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <div className="w-44 truncate font-medium">{it.name}</div>
                  <div className="flex-1 bg-muted rounded h-5 relative overflow-hidden">
                    <div className={`h-full rounded ${isMe ? 'bg-primary' : 'bg-amber-500/70'}`} style={{ width: `${w}%` }} />
                  </div>
                  <div className="w-40 text-right text-muted-foreground">{fmt(it.min)}–{fmt(it.max)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Chưa có đối thủ nào. Nhấn "Thêm mới" để bắt đầu.</p>
        )}
        {filtered.map(c => {
          const Icon = TYPE_META[c.type].icon;
          return (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 sm:items-start sm:justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 font-semibold">
                  <Icon className="h-4 w-4 text-primary" />
                  <span>{c.name}</span>
                  {c.star_rating ? <span className="text-amber-500">{'⭐'.repeat(c.star_rating)}</span> : null}
                </div>
                {c.address && <p className="text-sm text-muted-foreground">📍 {c.address}{c.area ? ` · ${c.area}` : ''}</p>}
                {c.type === 'hotel' && (c.room_prices || []).length > 0 && (
                  <p className="text-sm">{(c.room_prices || []).map(r => `${r.type}: ${fmt(r.min)}–${fmt(r.max)}`).join(' · ')}</p>
                )}
                {c.type !== 'hotel' && (c.price_per_person_min || c.price_per_person_max) ? (
                  <p className="text-sm">Giá: {fmt(c.price_per_person_min)}–{fmt(c.price_per_person_max)}/người{(c.cuisine_types || []).length ? ` · ${(c.cuisine_types || []).join(', ')}` : ''}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {c.google_rating ? `Google: ${c.google_rating}⭐ ` : ''}
                  {c.google_review_count ? `(${c.google_review_count} đánh giá) ` : ''}
                  {c.notes ? `· ${c.notes}` : ''}
                </p>
                {c.last_updated && <p className="text-[11px] text-muted-foreground">Cập nhật: {c.last_updated}</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(c)}><Pencil className="h-3 w-3" /></Button>
                <Button size="sm" variant="destructive" onClick={() => remove(c)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? 'Sửa đối thủ' : '+ Thêm đối thủ mới'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Loại</Label>
                <div className="flex gap-2 mt-1">
                  {(['hotel', 'restaurant', 'eatery'] as CType[]).map(t => (
                    <Button key={t} size="sm" type="button" variant={editing.type === t ? 'default' : 'outline'}
                      onClick={() => setEditing({ ...editing, type: t })}>
                      {TYPE_META[t].label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Tên *</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
                <div><Label>Khu vực</Label>
                  <Select value={editing.area || ''} onValueChange={v => setEditing({ ...editing, area: v })}>
                    <SelectTrigger><SelectValue placeholder="-- Chọn --" /></SelectTrigger>
                    <SelectContent>{AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2"><Label>Địa chỉ</Label><Input value={editing.address || ''} onChange={e => setEditing({ ...editing, address: e.target.value })} /></div>
                <div><Label>SĐT</Label><Input value={editing.phone || ''} onChange={e => setEditing({ ...editing, phone: e.target.value })} /></div>
                <div><Label>Website</Label><Input value={editing.website || ''} onChange={e => setEditing({ ...editing, website: e.target.value })} /></div>
              </div>

              {editing.type === 'hotel' && (
                <div className="border-t pt-3 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><Label>Số sao</Label>
                      <Select value={String(editing.star_rating || '')} onValueChange={v => setEditing({ ...editing, star_rating: parseInt(v) })}>
                        <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
                        <SelectContent>{[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{'⭐'.repeat(n)}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Giá phòng</Label>
                    <div className="space-y-2 mt-1">
                      {(editing.room_prices || []).map((rp, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-center">
                          <Input className="col-span-4" placeholder="Loại phòng" value={rp.type} onChange={e => {
                            const arr = [...(editing.room_prices || [])]; arr[i] = { ...arr[i], type: e.target.value };
                            setEditing({ ...editing, room_prices: arr });
                          }} />
                          <Input className="col-span-3" type="number" placeholder="Min" value={rp.min || ''} onChange={e => {
                            const arr = [...(editing.room_prices || [])]; arr[i] = { ...arr[i], min: parseInt(e.target.value) || 0 };
                            setEditing({ ...editing, room_prices: arr });
                          }} />
                          <Input className="col-span-3" type="number" placeholder="Max" value={rp.max || ''} onChange={e => {
                            const arr = [...(editing.room_prices || [])]; arr[i] = { ...arr[i], max: parseInt(e.target.value) || 0 };
                            setEditing({ ...editing, room_prices: arr });
                          }} />
                          <Button size="sm" variant="destructive" className="col-span-2" onClick={() => {
                            const arr = (editing.room_prices || []).filter((_, j) => j !== i);
                            setEditing({ ...editing, room_prices: arr });
                          }}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      ))}
                      <Button size="sm" variant="outline" type="button" onClick={() => setEditing({ ...editing, room_prices: [...(editing.room_prices || []), { type: '', min: 0, max: 0 }] })}>
                        <Plus className="h-3 w-3 mr-1" />Thêm loại phòng
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Tiện ích</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {HOTEL_AMENITIES.map(a => {
                        const on = (editing.amenities || []).includes(a);
                        return (
                          <Button key={a} size="sm" type="button" variant={on ? 'default' : 'outline'} onClick={() => {
                            const arr = on ? (editing.amenities || []).filter(x => x !== a) : [...(editing.amenities || []), a];
                            setEditing({ ...editing, amenities: arr });
                          }}>{a}</Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {editing.type !== 'hotel' && (
                <div className="border-t pt-3 space-y-3">
                  <div>
                    <Label>Loại ẩm thực</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {CUISINES.map(c => {
                        const on = (editing.cuisine_types || []).includes(c);
                        return (
                          <Button key={c} size="sm" type="button" variant={on ? 'default' : 'outline'} onClick={() => {
                            const arr = on ? (editing.cuisine_types || []).filter(x => x !== c) : [...(editing.cuisine_types || []), c];
                            setEditing({ ...editing, cuisine_types: arr });
                          }}>{c}</Button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><Label>Giá / người (từ)</Label><Input type="number" value={editing.price_per_person_min || ''} onChange={e => setEditing({ ...editing, price_per_person_min: parseInt(e.target.value) || 0 })} /></div>
                    <div><Label>Giá / người (đến)</Label><Input type="number" value={editing.price_per_person_max || ''} onChange={e => setEditing({ ...editing, price_per_person_max: parseInt(e.target.value) || 0 })} /></div>
                  </div>
                  <div><Label>Món đặc trưng</Label><Input value={editing.signature_dishes || ''} onChange={e => setEditing({ ...editing, signature_dishes: e.target.value })} /></div>
                </div>
              )}

              <div className="border-t pt-3 space-y-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div><Label>Google ⭐</Label><Input type="number" step="0.1" value={editing.google_rating || ''} onChange={e => setEditing({ ...editing, google_rating: parseFloat(e.target.value) || 0 })} /></div>
                  <div><Label>Số đánh giá</Label><Input type="number" value={editing.google_review_count || ''} onChange={e => setEditing({ ...editing, google_review_count: parseInt(e.target.value) || 0 })} /></div>
                  <div><Label>Admin chấm</Label>
                    <Select value={String(editing.admin_rating || '')} onValueChange={v => setEditing({ ...editing, admin_rating: parseInt(v) })}>
                      <SelectTrigger><SelectValue placeholder="--" /></SelectTrigger>
                      <SelectContent>{[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{'⭐'.repeat(n)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Điểm mạnh</Label><Textarea value={editing.strengths || ''} onChange={e => setEditing({ ...editing, strengths: e.target.value })} /></div>
                <div><Label>Điểm yếu</Label><Textarea value={editing.weaknesses || ''} onChange={e => setEditing({ ...editing, weaknesses: e.target.value })} /></div>
                <div><Label>Ghi chú</Label><Textarea value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })} /></div>
                <div><Label>Ngày cập nhật</Label><Input type="date" value={editing.last_updated || today()} onChange={e => setEditing({ ...editing, last_updated: e.target.value })} /></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={save}>💾 Lưu thông tin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
