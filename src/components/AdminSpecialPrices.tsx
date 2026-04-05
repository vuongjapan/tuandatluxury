import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Save, Trash2, Copy, Power, PowerOff, Flame } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface SpecialDate {
  id: string;
  date: string;
  is_active: boolean;
  note: string | null;
}

interface SpecialRoomPrice {
  id: string;
  special_date_id: string;
  room_id: string;
  price: number;
}

interface RoomInfo {
  id: string;
  name_vi: string;
  price_vnd: number;
  is_active: boolean | null;
}

const AdminSpecialPrices = () => {
  const { toast } = useToast();
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [specialRoomPrices, setSpecialRoomPrices] = useState<SpecialRoomPrice[]>([]);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar state
  const [calMonth, setCalMonth] = useState(new Date());
  const calYear = calMonth.getFullYear();
  const calM = calMonth.getMonth();

  // Selected date for editing
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [editPrices, setEditPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Copy source date
  const [copySource, setCopySource] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: sd }, { data: srp }, { data: r }] = await Promise.all([
      supabase.from('special_date_prices').select('*').order('date'),
      supabase.from('special_room_prices').select('*'),
      supabase.from('rooms').select('id, name_vi, price_vnd, is_active').eq('is_active', true).order('price_vnd'),
    ]);
    setSpecialDates((sd as any[]) || []);
    setSpecialRoomPrices((srp as any[]) || []);
    setRooms((r as any[]) || []);
    setLoading(false);
  };

  // Calendar helpers
  const daysInMonth = new Date(calYear, calM + 1, 0).getDate();
  const firstDay = new Date(calYear, calM, 1).getDay();
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

  const specialDateMap = useMemo(() => {
    const map: Record<string, SpecialDate> = {};
    specialDates.forEach(sd => { map[sd.date] = sd; });
    return map;
  }, [specialDates]);

  const selectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    const existing = specialDateMap[dateStr];
    setEditNote(existing?.note || '');

    const prices: Record<string, string> = {};
    rooms.forEach(r => {
      const srp = specialRoomPrices.find(p => p.special_date_id === existing?.id && p.room_id === r.id);
      prices[r.id] = srp ? String(srp.price) : '';
    });
    setEditPrices(prices);
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    setSaving(true);

    try {
      const existing = specialDateMap[selectedDate];
      let dateId = existing?.id;

      if (!dateId) {
        // Create new special date
        const { data, error } = await supabase.from('special_date_prices').insert({
          date: selectedDate,
          is_active: true,
          note: editNote || null,
        }).select('id').single();
        if (error) throw error;
        dateId = data.id;
      } else {
        // Update note
        await supabase.from('special_date_prices').update({ note: editNote || null }).eq('id', dateId);
      }

      // Upsert room prices
      for (const room of rooms) {
        const price = editPrices[room.id];
        if (!price || parseInt(price) <= 0) continue;

        const existingPrice = specialRoomPrices.find(p => p.special_date_id === dateId && p.room_id === room.id);
        if (existingPrice) {
          await supabase.from('special_room_prices').update({ price: parseInt(price) }).eq('id', existingPrice.id);
        } else {
          await supabase.from('special_room_prices').insert({
            special_date_id: dateId!,
            room_id: room.id,
            price: parseInt(price),
          });
        }
      }

      toast({ title: 'Đã lưu giá đặc biệt ✓' });
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const toggleActive = async (dateStr: string) => {
    const sd = specialDateMap[dateStr];
    if (!sd) return;
    const { error } = await supabase.from('special_date_prices').update({ is_active: !sd.is_active }).eq('id', sd.id);
    if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
    toast({ title: sd.is_active ? 'Đã tắt giá đặc biệt' : 'Đã bật giá đặc biệt' });
    fetchAll();
  };

  const deleteSpecialDate = async (dateStr: string) => {
    const sd = specialDateMap[dateStr];
    if (!sd) return;
    if (!confirm(`Xóa giá đặc biệt ngày ${dateStr}?`)) return;
    const { error } = await supabase.from('special_date_prices').delete().eq('id', sd.id);
    if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
    toast({ title: 'Đã xóa ✓' });
    if (selectedDate === dateStr) setSelectedDate(null);
    fetchAll();
  };

  const handleCopyPrices = () => {
    if (!selectedDate || !copySource) return;
    const source = specialDateMap[copySource];
    if (!source) { toast({ title: 'Ngày nguồn không có giá đặc biệt', variant: 'destructive' }); return; }
    
    const prices: Record<string, string> = {};
    rooms.forEach(r => {
      const srp = specialRoomPrices.find(p => p.special_date_id === source.id && p.room_id === r.id);
      prices[r.id] = srp ? String(srp.price) : '';
    });
    setEditPrices(prices);
    setEditNote(source.note || '');
    toast({ title: `Đã copy giá từ ${copySource}` });
    setCopySource(null);
  };

  const formatVND = (n: number) => n.toLocaleString('vi-VN') + 'đ';

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-1">
          <Flame className="h-5 w-5 text-destructive" />
          Giá đặc biệt theo ngày
        </h3>
        <p className="text-sm text-muted-foreground">
          Thiết lập giá cao điểm / lễ tết cho từng phòng. Giá đặc biệt <strong>đè toàn bộ</strong> giá tháng, giá cuối tuần.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setCalMonth(new Date(calYear, calM - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-display text-lg font-semibold">{monthNames[calM]} {calYear}</span>
            <Button variant="ghost" size="icon" onClick={() => setCalMonth(new Date(calYear, calM + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const dateStr = `${calYear}-${String(calM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const sd = specialDateMap[dateStr];
              const isSelected = selectedDate === dateStr;
              const isSpecial = !!sd;
              const isActive = sd?.is_active ?? false;

              return (
                <button
                  key={d}
                  onClick={() => selectDate(dateStr)}
                  className={`
                    relative p-1.5 rounded-lg text-center transition-all min-h-[48px] flex flex-col items-center justify-center
                    hover:bg-secondary cursor-pointer
                    ${isSelected ? 'ring-2 ring-primary bg-primary/10' : ''}
                    ${isSpecial && isActive ? 'bg-destructive/10 border border-destructive/30' : ''}
                    ${isSpecial && !isActive ? 'bg-muted border border-border' : ''}
                  `}
                >
                  <span className="text-sm font-medium">{d}</span>
                  {isSpecial && (
                    <span className={`text-[9px] font-bold ${isActive ? 'text-destructive' : 'text-muted-foreground line-through'}`}>
                      HOT
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive/10 border border-destructive/30" /> Giá đặc biệt (bật)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted border border-border" /> Giá đặc biệt (tắt)</span>
          </div>
        </div>

        {/* Edit panel */}
        <div className="bg-card rounded-xl border border-border p-5">
          {!selectedDate ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm py-12">
              👈 Chọn một ngày trên lịch để thiết lập giá
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-semibold text-lg">
                  {format(new Date(selectedDate + 'T00:00:00'), 'dd/MM/yyyy (EEEE)', { locale: vi })}
                </h4>
                <div className="flex items-center gap-2">
                  {specialDateMap[selectedDate] && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => toggleActive(selectedDate)} title={specialDateMap[selectedDate].is_active ? 'Tắt' : 'Bật'}>
                        {specialDateMap[selectedDate].is_active ? <Power className="h-4 w-4 text-green-600" /> : <PowerOff className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteSpecialDate(selectedDate)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {specialDateMap[selectedDate] && (
                <Badge variant={specialDateMap[selectedDate].is_active ? 'default' : 'secondary'}>
                  {specialDateMap[selectedDate].is_active ? '🔥 Đang bật' : '⏸️ Đã tắt'}
                </Badge>
              )}

              {/* Note */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Ghi chú (VD: Lễ 30/4, Cao điểm hè)</label>
                <Input value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="Nhập ghi chú..." />
              </div>

              {/* Room prices */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Giá từng phòng</label>
                {rooms.map(room => (
                  <div key={room.id} className="flex items-center gap-3">
                    <span className="text-sm font-medium flex-1 min-w-0 truncate">{room.name_vi}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Gốc: {formatVND(room.price_vnd)}</span>
                    <Input
                      type="number"
                      className="w-32"
                      placeholder="Giá đặc biệt"
                      value={editPrices[room.id] || ''}
                      onChange={e => setEditPrices(prev => ({ ...prev, [room.id]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>

              {/* Copy from another date */}
              <div className="border-t border-border pt-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Copy giá từ ngày khác</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={copySource || ''}
                    onChange={e => setCopySource(e.target.value || null)}
                  >
                    <option value="">Chọn ngày nguồn...</option>
                    {specialDates.filter(sd => sd.date !== selectedDate).map(sd => (
                      <option key={sd.id} value={sd.date}>{sd.date} {sd.note ? `(${sd.note})` : ''}</option>
                    ))}
                  </select>
                  <Button variant="outline" size="sm" onClick={handleCopyPrices} disabled={!copySource}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                  </Button>
                </div>
              </div>

              {/* Save */}
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Đang lưu...' : 'Lưu giá đặc biệt'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* List of special dates */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h4 className="font-display font-semibold mb-3">Danh sách ngày đặc biệt ({specialDates.length})</h4>
        {specialDates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Chưa có ngày đặc biệt nào</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {specialDates.map(sd => {
              const prices = specialRoomPrices.filter(p => p.special_date_id === sd.id);
              return (
                <div key={sd.id} className={`flex items-center gap-3 p-3 rounded-lg ${sd.is_active ? 'bg-destructive/5 border border-destructive/20' : 'bg-muted'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{format(new Date(sd.date + 'T00:00:00'), 'dd/MM/yyyy (EEEE)', { locale: vi })}</span>
                      <Badge variant={sd.is_active ? 'default' : 'secondary'} className="text-[10px]">
                        {sd.is_active ? 'BẬT' : 'TẮT'}
                      </Badge>
                    </div>
                    {sd.note && <p className="text-xs text-muted-foreground">{sd.note}</p>}
                    <div className="flex flex-wrap gap-2 mt-1">
                      {prices.map(p => {
                        const r = rooms.find(rm => rm.id === p.room_id);
                        return (
                          <span key={p.id} className="text-xs bg-background px-2 py-0.5 rounded border">
                            {r?.name_vi || p.room_id}: {formatVND(p.price)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => selectDate(sd.date)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(sd.date)}>
                      {sd.is_active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteSpecialDate(sd.date)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSpecialPrices;
