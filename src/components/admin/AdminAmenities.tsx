import { useState } from 'react';
import { useRoomAmenities, RoomAmenity } from '@/hooks/useRoomAmenities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, GripVertical, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORY_LABELS: Record<string, string> = {
  room_features: '🧰 Trang thiết bị trong phòng',
  benefits: '🎁 Ưu đãi dành cho khách',
  highlights: '📦 Dịch vụ kèm theo (hiển thị nhanh)',
};

const CATEGORY_DESC: Record<string, string> = {
  room_features: 'Hiển thị khi khách bấm "Xem chi tiết phòng"',
  benefits: 'Danh sách ưu đãi đi kèm phòng',
  highlights: 'Hiển thị mặc định trên thẻ phòng (2-4 mục nổi bật)',
};

const AdminAmenities = () => {
  const { amenities, isLoading, upsertAmenity, deleteAmenity } = useRoomAmenities();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>('room_features');
  const [newItem, setNewItem] = useState({ name_vi: '', name_en: '', icon: '✓' });

  const filtered = amenities.filter(a => a.category === activeCategory).sort((a, b) => a.sort_order - b.sort_order);

  const handleAdd = async () => {
    if (!newItem.name_vi.trim()) return;
    try {
      await upsertAmenity.mutateAsync({
        category: activeCategory,
        name_vi: newItem.name_vi,
        name_en: newItem.name_en,
        icon: newItem.icon || '✓',
        sort_order: filtered.length,
      });
      setNewItem({ name_vi: '', name_en: '', icon: '✓' });
      toast({ title: 'Đã thêm tiện nghi' });
    } catch {
      toast({ title: 'Lỗi', variant: 'destructive' });
    }
  };

  const handleToggle = async (item: RoomAmenity) => {
    try {
      await upsertAmenity.mutateAsync({ id: item.id, is_active: !item.is_active });
    } catch {
      toast({ title: 'Lỗi', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa tiện nghi này?')) return;
    try {
      await deleteAmenity.mutateAsync(id);
      toast({ title: 'Đã xóa' });
    } catch {
      toast({ title: 'Lỗi', variant: 'destructive' });
    }
  };

  const handleUpdate = async (item: RoomAmenity, field: string, value: string) => {
    try {
      await upsertAmenity.mutateAsync({ id: item.id, [field]: value });
    } catch {
      toast({ title: 'Lỗi', variant: 'destructive' });
    }
  };

  if (isLoading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Tiện nghi phòng</h2>
          <p className="text-sm text-muted-foreground">Quản lý tiện nghi hiển thị trên tất cả trang phòng, đặt phòng và tiện nghi</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeCategory === key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{CATEGORY_DESC[activeCategory]}</p>

      {/* Items list */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-2 p-3 bg-secondary text-xs font-semibold text-muted-foreground">
          <span></span>
          <span>Icon & Tên (VI)</span>
          <span>Tên (EN)</span>
          <span>Hiển thị</span>
          <span>Thứ tự</span>
          <span></span>
        </div>
        {filtered.map((item) => (
          <div key={item.id} className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-2 p-3 border-t border-border items-center">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <div className="flex items-center gap-2">
              <Input
                value={item.icon}
                onChange={(e) => handleUpdate(item, 'icon', e.target.value)}
                className="w-12 text-center p-1 h-8"
              />
              <Input
                defaultValue={item.name_vi}
                onBlur={(e) => handleUpdate(item, 'name_vi', e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <Input
              defaultValue={item.name_en}
              onBlur={(e) => handleUpdate(item, 'name_en', e.target.value)}
              className="h-8 text-sm"
            />
            <Switch checked={item.is_active} onCheckedChange={() => handleToggle(item)} />
            <Input
              type="number"
              defaultValue={item.sort_order}
              onBlur={(e) => handleUpdate(item, 'sort_order', e.target.value)}
              className="w-16 h-8 text-sm text-center"
            />
            <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-destructive hover:text-destructive h-8 w-8 p-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-6 text-sm">Chưa có tiện nghi nào</p>
        )}
      </div>

      {/* Add new */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold mb-3">Thêm tiện nghi mới</h3>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-xs text-muted-foreground">Icon</label>
            <Input value={newItem.icon} onChange={(e) => setNewItem(p => ({ ...p, icon: e.target.value }))} className="w-16 text-center" />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-xs text-muted-foreground">Tên (Tiếng Việt) *</label>
            <Input value={newItem.name_vi} onChange={(e) => setNewItem(p => ({ ...p, name_vi: e.target.value }))} placeholder="VD: Điều hòa" />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-xs text-muted-foreground">Tên (English)</label>
            <Input value={newItem.name_en} onChange={(e) => setNewItem(p => ({ ...p, name_en: e.target.value }))} placeholder="e.g. Air Conditioning" />
          </div>
          <Button onClick={handleAdd} disabled={!newItem.name_vi.trim()} className="gap-1">
            <Plus className="h-4 w-4" /> Thêm
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminAmenities;
