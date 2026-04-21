import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/compressImage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AMENITY_ICONS } from '@/data/rooms';
import { Save, Upload, Pencil, DollarSign, CalendarRange, ChevronLeft, ChevronRight, Trash2, ImageIcon, GripVertical } from 'lucide-react';

const ALL_AMENITIES = Object.keys(AMENITY_ICONS);
const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

interface Props {
  rooms: any[];
  onRefresh: () => void;
}

const AdminRooms = ({ rooms, onRefresh }: Props) => {
  const { toast } = useToast();
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [uploadingRoomImage, setUploadingRoomImage] = useState(false);
  const [roomGallery, setRoomGallery] = useState<any[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Monthly prices
  const [monthlyPrices, setMonthlyPrices] = useState<any[]>([]);
  const [mpRoom, setMpRoom] = useState('');
  const [mpYear, setMpYear] = useState(new Date().getFullYear());
  const [mpMonth, setMpMonth] = useState(new Date().getMonth() + 1);
  const [mpWeekday, setMpWeekday] = useState('');
  const [mpWeekend, setMpWeekend] = useState('');
  const [mpSunday, setMpSunday] = useState('');

  // Daily availability
  const [dailyAvailability, setDailyAvailability] = useState<any[]>([]);
  const [daRoom, setDaRoom] = useState('');
  const [daCalMonth, setDaCalMonth] = useState(new Date());

  useEffect(() => {
    fetchMonthlyPrices();
    fetchDailyAvailability();
  }, []);

  const fetchMonthlyPrices = async () => {
    const { data } = await supabase.from('room_monthly_prices').select('*').order('year').order('month');
    setMonthlyPrices(data || []);
  };

  const fetchDailyAvailability = async () => {
    const { data } = await supabase.from('room_daily_availability').select('*').order('date');
    setDailyAvailability(data || []);
  };

  const fetchRoomGallery = async (roomId: string) => {
    const { data } = await supabase.from('room_images').select('*').eq('room_id', roomId).order('sort_order');
    setRoomGallery(data || []);
  };

  useEffect(() => {
    if (editingRoom?.id) fetchRoomGallery(editingRoom.id);
    else setRoomGallery([]);
  }, [editingRoom?.id]);

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editingRoom) return;
    setUploadingGallery(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i], { maxWidth: 1920, quality: 0.8 });
        const path = `rooms/${editingRoom.id}-gallery-${Date.now()}-${i}.jpg`;
        const { error: uploadError } = await supabase.storage.from('gallery').upload(path, compressed);
        if (uploadError) continue;
        const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(path);
        await supabase.from('room_images').insert({
          room_id: editingRoom.id,
          image_url: urlData.publicUrl,
          sort_order: roomGallery.length + i,
        });
      }
      toast({ title: `Đã thêm ${files.length} ảnh` });
      fetchRoomGallery(editingRoom.id);
    } catch (err: any) {
      toast({ title: 'Lỗi upload', description: err.message, variant: 'destructive' });
    }
    setUploadingGallery(false);
    e.target.value = '';
  };

  const deleteRoomImage = async (imgId: string) => {
    if (!confirm('Xóa ảnh này?')) return;
    await supabase.from('room_images').delete().eq('id', imgId);
    toast({ title: 'Đã xóa ảnh' });
    if (editingRoom?.id) fetchRoomGallery(editingRoom.id);
  };
  useEffect(() => {
    if (!mpRoom) return;
    const existing = monthlyPrices.find((p: any) => p.room_id === mpRoom && p.year === mpYear && p.month === mpMonth);
    if (existing) {
      setMpWeekday(String(existing.price_weekday));
      setMpWeekend(String(existing.price_weekend));
      setMpSunday(String(existing.price_sunday));
    } else {
      const room = rooms.find((r: any) => r.id === mpRoom);
      setMpWeekday(room ? String(room.price_vnd) : '');
      setMpWeekend(room ? String(room.price_vnd) : '');
      setMpSunday(room ? String(room.price_vnd) : '');
    }
  }, [mpRoom, mpYear, mpMonth, monthlyPrices, rooms]);

  const handleRoomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingRoom) return;
    setUploadingRoomImage(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 1200, quality: 0.7 });
      const path = `rooms/${editingRoom.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('gallery').upload(path, compressed);
      if (uploadError) { toast({ title: 'Lỗi upload ảnh phòng', variant: 'destructive' }); setUploadingRoomImage(false); return; }
      const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(path);
      setEditingRoom({ ...editingRoom, image_url: urlData.publicUrl });
      toast({ title: 'Đã upload ảnh phòng ✓' });
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    }
    setUploadingRoomImage(false);
    e.target.value = '';
  };

  const toggleAmenity = (amenity: string) => {
    if (!editingRoom) return;
    const current = editingRoom.amenities || [];
    const updated = current.includes(amenity) ? current.filter((a: string) => a !== amenity) : [...current, amenity];
    setEditingRoom({ ...editingRoom, amenities: updated });
  };

  const updateRoom = async () => {
    if (!editingRoom) return;
    const { error } = await supabase.from('rooms').update({
      name_vi: editingRoom.name_vi, name_en: editingRoom.name_en,
      name_ja: editingRoom.name_ja, name_zh: editingRoom.name_zh,
      price_vnd: editingRoom.price_vnd, capacity: editingRoom.capacity,
      size_sqm: editingRoom.size_sqm, description_vi: editingRoom.description_vi,
      description_en: editingRoom.description_en, description_ja: editingRoom.description_ja,
      description_zh: editingRoom.description_zh, is_active: editingRoom.is_active,
      amenities: editingRoom.amenities, image_url: editingRoom.image_url,
      total_rooms: editingRoom.total_rooms || 1,
      bed_type: editingRoom.bed_type || '',
      view_type: editingRoom.view_type || '',
      has_balcony: editingRoom.has_balcony || false,
    }).eq('id', editingRoom.id);
    if (error) { toast({ title: 'Lỗi lưu phòng', variant: 'destructive' }); return; }
    toast({ title: 'Đã lưu thông tin phòng ✓' });
    setEditingRoom(null);
    onRefresh();
  };

  const saveMonthlyPrice = async () => {
    if (!mpRoom || !mpWeekday || !mpWeekend || !mpSunday) {
      toast({ title: 'Vui lòng điền đầy đủ giá', variant: 'destructive' }); return;
    }
    const { error } = await supabase.from('room_monthly_prices').upsert({
      room_id: mpRoom, year: mpYear, month: mpMonth,
      price_weekday: parseInt(mpWeekday), price_weekend: parseInt(mpWeekend), price_sunday: parseInt(mpSunday),
    }, { onConflict: 'room_id,year,month' });
    if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Đã lưu bảng giá tháng ✓' });
    fetchMonthlyPrices();
  };

  const deleteMonthlyPrice = async (id: string) => {
    await supabase.from('room_monthly_prices').delete().eq('id', id);
    toast({ title: 'Đã xóa ✓' });
    fetchMonthlyPrices();
  };

  const toggleDayAvailability = async (roomId: string, dateStr: string, currentStatus: string | null) => {
    const nextStatus = currentStatus === null ? 'closed' : currentStatus === 'open' ? 'closed' : currentStatus === 'closed' ? 'limited' : currentStatus === 'limited' ? 'combo' : 'open';
    const existing = dailyAvailability.find((a: any) => a.room_id === roomId && a.date === dateStr);
    let error: any = null;
    if (currentStatus === null) {
      const r = await supabase.from('room_daily_availability').insert({ room_id: roomId, date: dateStr, status: nextStatus, rooms_available: nextStatus === 'limited' ? 1 : 0 });
      error = r.error;
    } else if (nextStatus === 'open') {
      if (existing) { const r = await supabase.from('room_daily_availability').delete().eq('id', existing.id); error = r.error; }
    } else if (existing) {
      const r = await supabase.from('room_daily_availability').update({ status: nextStatus, rooms_available: nextStatus === 'limited' ? 1 : 0 }).eq('id', existing.id);
      error = r.error;
    } else {
      const r = await supabase.from('room_daily_availability').insert({ room_id: roomId, date: dateStr, status: nextStatus, rooms_available: nextStatus === 'limited' ? 1 : 0 });
      error = r.error;
    }
    if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); return; }
    fetchDailyAvailability();
  };

  const daYear = daCalMonth.getFullYear();
  const daMonth = daCalMonth.getMonth();
  const daDaysInMonth = new Date(daYear, daMonth + 1, 0).getDate();
  const daFirstDay = new Date(daYear, daMonth, 1).getDay();
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <div className="space-y-6">
      {/* Room edit form */}
      {editingRoom && (
        <div className="bg-card rounded-xl border-2 border-primary p-4 sm:p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Chỉnh sửa: {editingRoom.name_vi}</h3>
          <div className="mb-4">
            <label className="text-xs text-muted-foreground uppercase font-semibold mb-2 block">Ảnh phòng</label>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {editingRoom.image_url && (
                <img src={editingRoom.image_url} alt="" className="w-full sm:w-40 h-28 object-cover rounded-lg border border-border"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
              )}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleRoomImageUpload} disabled={uploadingRoomImage} />
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                  <Upload className="h-4 w-4" /> {uploadingRoomImage ? 'Đang tải...' : 'Upload ảnh mới'}
                </span>
              </label>
            </div>
          </div>
          {/* Multi-image gallery */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground uppercase font-semibold mb-2 block">
              <ImageIcon className="h-3.5 w-3.5 inline mr-1" />Thư viện ảnh phòng ({roomGallery.length} ảnh)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
              {roomGallery.map((img, idx) => (
                <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border">
                  <img src={img.image_url} alt="" className="w-full aspect-[4/3] object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                  <button onClick={() => deleteRoomImage(img.id)}
                    className="absolute top-1 right-1 p-1 bg-destructive/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-3 w-3 text-white" />
                  </button>
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5">{idx + 1}</span>
                </div>
              ))}
            </div>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} disabled={uploadingGallery} />
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-accent border border-border rounded-lg text-sm font-medium cursor-pointer transition-colors">
                <Upload className="h-4 w-4" /> {uploadingGallery ? 'Đang tải...' : 'Thêm ảnh (chọn nhiều)'}
              </span>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Tên (VI)', key: 'name_vi' }, { label: 'Tên (EN)', key: 'name_en' },
              { label: 'Tên (JA)', key: 'name_ja' }, { label: 'Tên (ZH)', key: 'name_zh' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">{f.label}</label>
                <Input value={editingRoom[f.key] || ''} onChange={e => setEditingRoom({ ...editingRoom, [f.key]: e.target.value })} />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Giá cơ bản (VND/đêm)</label>
              <Input type="number" value={editingRoom.price_vnd} onChange={e => setEditingRoom({ ...editingRoom, price_vnd: +e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Sức chứa</label>
              <Input type="number" value={editingRoom.capacity} onChange={e => setEditingRoom({ ...editingRoom, capacity: +e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Diện tích (m²)</label>
              <Input type="number" value={editingRoom.size_sqm} onChange={e => setEditingRoom({ ...editingRoom, size_sqm: +e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Số lượng phòng</label>
              <Input type="number" value={editingRoom.total_rooms || 1} onChange={e => setEditingRoom({ ...editingRoom, total_rooms: +e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Loại giường</label>
              <Input value={editingRoom.bed_type || ''} onChange={e => setEditingRoom({ ...editingRoom, bed_type: e.target.value })} placeholder="VD: 2 giường đôi lớn" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">View phòng</label>
              <select
                value={editingRoom.view_type || 'sea_view'}
                onChange={e => setEditingRoom({ ...editingRoom, view_type: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="sea_view">🌊 View biển</option>
                <option value="city_view">🏙️ View thành phố</option>
                <option value="pool_view">🏊 View hồ bơi</option>
                <option value="garden_view">🌿 View vườn</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={editingRoom.has_balcony || false} onChange={e => setEditingRoom({ ...editingRoom, has_balcony: e.target.checked })} />
              <label className="text-sm">Có ban công</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={editingRoom.is_active} onChange={e => setEditingRoom({ ...editingRoom, is_active: e.target.checked })} />
              <label className="text-sm">Hiển thị phòng</label>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {[
              { label: 'Mô tả (VI)', key: 'description_vi' }, { label: 'Mô tả (EN)', key: 'description_en' },
              { label: 'Mô tả (JA)', key: 'description_ja' }, { label: 'Mô tả (ZH)', key: 'description_zh' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">{f.label}</label>
                <Textarea value={editingRoom[f.key] || ''} onChange={e => setEditingRoom({ ...editingRoom, [f.key]: e.target.value })} rows={2} />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <label className="text-xs text-muted-foreground uppercase font-semibold mb-2 block">Tiện nghi</label>
            <div className="flex flex-wrap gap-2">
              {ALL_AMENITIES.map(amenity => {
                const isSelected = (editingRoom.amenities || []).includes(amenity);
                return (
                  <button key={amenity} onClick={() => toggleAmenity(amenity)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/50'}`}>
                    {AMENITY_ICONS[amenity]?.label.vi || amenity}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="hero" onClick={updateRoom}><Save className="h-4 w-4 mr-2" />Lưu</Button>
            <Button variant="outline" onClick={() => setEditingRoom(null)}>Hủy</Button>
          </div>
        </div>
      )}

      {/* Room cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(room => (
          <div key={room.id} className="bg-card rounded-xl border border-border p-4">
            <div className="flex gap-3 mb-3">
              {room.image_url && (
                <img src={room.image_url} alt="" className="w-20 h-14 object-cover rounded-lg border border-border"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-sm font-semibold truncate">{room.name_vi}</h3>
                <p className="text-xs text-muted-foreground truncate">{room.name_en}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${room.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {room.is_active ? 'Hiện' : 'Ẩn'}
                </span>
              </div>
            </div>
            <div className="bg-secondary rounded-lg p-2 mb-3 text-center">
              <p className="text-xs text-muted-foreground">{room.total_rooms || 1} phòng | {room.bed_type || '—'} | {room.size_sqm}m²</p>
              <p className="font-bold text-primary text-sm">{room.price_vnd?.toLocaleString('vi')}₫/đêm</p>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={() => setEditingRoom(room)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />Chỉnh sửa
            </Button>
          </div>
        ))}
      </div>

      {/* Monthly prices */}
      <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
        <h3 className="font-display text-lg font-semibold mb-2">
          <DollarSign className="h-5 w-5 inline mr-2 text-primary" />Bảng giá theo tháng
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          3 mức giá: <strong>Ngày thường</strong> (T2→T5), <strong>Cuối tuần</strong> (T6 & T7), <strong>Chủ nhật</strong> (CN).
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Phòng</label>
            <Select value={mpRoom} onValueChange={setMpRoom}>
              <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
              <SelectContent>{rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name_vi}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Năm</label>
            <Select value={String(mpYear)} onValueChange={v => setMpYear(+v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{[2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Tháng</label>
            <Select value={String(mpMonth)} onValueChange={v => setMpMonth(+v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Ngày thường</label>
            <Input type="number" value={mpWeekday} onChange={e => setMpWeekday(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Cuối tuần</label>
            <Input type="number" value={mpWeekend} onChange={e => setMpWeekend(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Chủ nhật</label>
            <div className="flex gap-2">
              <Input type="number" value={mpSunday} onChange={e => setMpSunday(e.target.value)} />
              <Button variant="hero" onClick={saveMonthlyPrice} className="shrink-0"><Save className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
        {monthlyPrices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-secondary">
                <tr>
                  {['Phòng', 'Tháng', 'Ngày thường', 'Cuối tuần', 'Chủ nhật', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthlyPrices.map((p: any) => (
                  <tr key={p.id} className="hover:bg-secondary/50">
                    <td className="px-3 py-2 text-xs">{rooms.find(r => r.id === p.room_id)?.name_vi || p.room_id}</td>
                    <td className="px-3 py-2 text-xs">{MONTH_NAMES[p.month - 1]} {p.year}</td>
                    <td className="px-3 py-2 font-semibold text-primary text-xs">{p.price_weekday?.toLocaleString('vi')}₫</td>
                    <td className="px-3 py-2 font-semibold text-primary text-xs">{p.price_weekend?.toLocaleString('vi')}₫</td>
                    <td className="px-3 py-2 font-semibold text-primary text-xs">{p.price_sunday?.toLocaleString('vi')}₫</td>
                    <td className="px-3 py-2">
                      <button onClick={() => deleteMonthlyPrice(p.id)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily availability */}
      <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
        <h3 className="font-display text-lg font-semibold mb-2">
          <CalendarRange className="h-5 w-5 inline mr-2 text-primary" />Trạng thái bán theo ngày
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Click để chuyển: <strong className="text-green-600">Mở</strong> → <strong className="text-destructive">Đóng</strong> → <strong className="text-yellow-600">Giới hạn</strong> → <strong className="text-purple-600">Combo</strong> → Mở
        </p>
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <div>
            <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Phòng</label>
            <Select value={daRoom} onValueChange={setDaRoom}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Chọn phòng" /></SelectTrigger>
              <SelectContent>{rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name_vi}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="ghost" size="icon" onClick={() => setDaCalMonth(new Date(daYear, daMonth - 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="font-display text-lg font-semibold min-w-[140px] text-center">{MONTH_NAMES[daMonth]} {daYear}</span>
            <Button variant="ghost" size="icon" onClick={() => setDaCalMonth(new Date(daYear, daMonth + 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
        {daRoom ? (
          <div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(d => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: daFirstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daDaysInMonth }).map((_, i) => {
                const d = i + 1;
                const dateStr = `${daYear}-${String(daMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const avail = dailyAvailability.find((a: any) => a.room_id === daRoom && a.date === dateStr);
                const status = avail?.status || 'open';
                return (
                  <button key={d} onClick={() => toggleDayAvailability(daRoom, dateStr, avail ? status : null)}
                    className={`min-h-[44px] rounded-lg text-center transition-all flex flex-col items-center justify-center cursor-pointer border
                      ${status === 'open' ? 'bg-green-50 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800' : ''}
                      ${status === 'closed' ? 'bg-destructive/10 border-destructive/30 hover:bg-destructive/20' : ''}
                      ${status === 'limited' ? 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100 dark:bg-yellow-900/20' : ''}
                      ${status === 'combo' ? 'bg-purple-50 border-purple-300 hover:bg-purple-100 dark:bg-purple-900/20' : ''}
                    `}>
                    <span className="text-xs font-medium">{d}</span>
                    <span className={`text-[9px] font-semibold ${status === 'open' ? 'text-green-600' : status === 'closed' ? 'text-destructive' : status === 'combo' ? 'text-purple-600' : 'text-yellow-600'}`}>
                      {status === 'open' ? 'Mở' : status === 'closed' ? 'Đóng' : status === 'combo' ? 'Combo' : 'GH'}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300" /> Mở bán</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive/20 border border-destructive/40" /> Đóng</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-400" /> Giới hạn</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-100 border border-purple-400" /> Combo</span>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Chọn phòng để quản lý trạng thái bán.</p>
        )}
      </div>
    </div>
  );
};

export default AdminRooms;
