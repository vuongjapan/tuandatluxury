import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, ImagePlus, Loader2, Eye, EyeOff, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePromoPopups, type PromoPopup } from '@/hooks/usePromoPopups';

type EditableForm = Partial<PromoPopup>;

const empty = (): EditableForm => ({
  title: 'Ưu đãi đặt phòng qua web',
  image_url: '',
  link_url: '/khuyen-mai',
  position: 'bottom-left',
  display_delay_seconds: 3,
  dismiss_duration_hours: 24,
  start_date: null,
  end_date: null,
  is_active: true,
  sort_order: 0,
});

export default function AdminPromoPopups() {
  const { popups, isLoading, refetch } = usePromoPopups();
  const [editing, setEditing] = useState<EditableForm | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (file: File) => {
    if (!editing) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh tối đa 5MB');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `popup-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('site-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
      setEditing({ ...editing, image_url: data.publicUrl });
      toast.success('✓ Ảnh đã tải lên');
    } catch (e: any) {
      toast.error('Upload thất bại: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.image_url) {
      toast.error('Vui lòng tải ảnh popup');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        title: editing.title || '',
        image_url: editing.image_url,
        link_url: editing.link_url || null,
        position: editing.position || 'bottom-left',
        display_delay_seconds: Number(editing.display_delay_seconds) || 3,
        dismiss_duration_hours: Number(editing.dismiss_duration_hours) || 24,
        start_date: editing.start_date || null,
        end_date: editing.end_date || null,
        is_active: editing.is_active ?? true,
        sort_order: Number(editing.sort_order) || 0,
      };
      let error;
      if (editing.id) {
        ({ error } = await (supabase as any).from('promo_popups').update(payload).eq('id', editing.id));
      } else {
        ({ error } = await (supabase as any).from('promo_popups').insert(payload));
      }
      if (error) throw error;
      toast.success('✓ Đã lưu popup');
      setEditing(null);
      refetch();
    } catch (e: any) {
      toast.error('Lưu thất bại: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa popup này?')) return;
    const { error } = await (supabase as any).from('promo_popups').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Đã xóa');
    refetch();
  };

  const toggleActive = async (p: PromoPopup) => {
    const { error } = await (supabase as any)
      .from('promo_popups')
      .update({ is_active: !p.is_active })
      .eq('id', p.id);
    if (error) { toast.error(error.message); return; }
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Popup quảng cáo (kiểu Vinpearl)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Popup hiển thị ở góc trang chủ, scroll cùng trang. Khách có thể tắt.
          </p>
        </div>
        {!editing && (
          <Button onClick={() => setEditing(empty())}>
            <Plus className="h-4 w-4 mr-2" /> Tạo popup mới
          </Button>
        )}
      </div>

      {editing && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing.id ? 'Chỉnh sửa popup' : 'Popup mới'}</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Tiêu đề (nội bộ)</Label>
              <Input
                value={editing.title || ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="VD: Flash Sale 72H"
              />
            </div>
            <div>
              <Label>Link khi click</Label>
              <Input
                value={editing.link_url || ''}
                onChange={(e) => setEditing({ ...editing, link_url: e.target.value })}
                placeholder="/khuyen-mai hoặc https://..."
              />
            </div>
          </div>

          <div>
            <Label>Ảnh popup * (tỉ lệ dọc 3:4 đẹp nhất, tối đa 5MB)</Label>
            <div className="flex items-center gap-3 mt-2">
              {editing.image_url ? (
                <img src={editing.image_url} alt="" className="w-32 h-40 object-cover rounded-lg border border-border" />
              ) : (
                <div className="w-32 h-40 bg-muted rounded-lg flex items-center justify-center border border-dashed border-border">
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <input
                  type="file"
                  id="popup-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
                <Button asChild variant="outline" size="sm" disabled={uploading}>
                  <label htmlFor="popup-upload" className="cursor-pointer">
                    {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImagePlus className="h-4 w-4 mr-2" />}
                    {editing.image_url ? 'Đổi ảnh' : 'Tải ảnh lên'}
                  </label>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Vị trí</Label>
              <Select
                value={editing.position || 'bottom-left'}
                onValueChange={(v) => setEditing({ ...editing, position: v as any })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-left">Góc trái dưới</SelectItem>
                  <SelectItem value="bottom-right">Góc phải dưới</SelectItem>
                  <SelectItem value="center">Giữa màn hình (modal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hiện sau (giây)</Label>
              <Input
                type="number"
                min={0}
                value={editing.display_delay_seconds ?? 3}
                onChange={(e) => setEditing({ ...editing, display_delay_seconds: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Ẩn sau khi tắt (giờ)</Label>
              <Input
                type="number"
                min={1}
                value={editing.dismiss_duration_hours ?? 24}
                onChange={(e) => setEditing({ ...editing, dismiss_duration_hours: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Bắt đầu (tùy chọn)</Label>
              <Input
                type="datetime-local"
                value={editing.start_date ? editing.start_date.slice(0, 16) : ''}
                onChange={(e) => setEditing({ ...editing, start_date: e.target.value || null })}
              />
            </div>
            <div>
              <Label>Kết thúc (tùy chọn)</Label>
              <Input
                type="datetime-local"
                value={editing.end_date ? editing.end_date.slice(0, 16) : ''}
                onChange={(e) => setEditing({ ...editing, end_date: e.target.value || null })}
              />
            </div>
            <div>
              <Label>Thứ tự</Label>
              <Input
                type="number"
                value={editing.sort_order ?? 0}
                onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={editing.is_active ?? true}
              onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
            />
            <Label>Hiển thị popup</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setEditing(null)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Lưu popup
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {isLoading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
        {!isLoading && popups.length === 0 && (
          <p className="text-sm text-muted-foreground italic">Chưa có popup nào.</p>
        )}
        {popups.map((p) => (
          <div key={p.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
            <img src={p.image_url} alt={p.title} className="w-16 h-20 object-cover rounded-lg" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{p.title || '(không tên)'}</p>
              <p className="text-xs text-muted-foreground truncate">{p.link_url || '— không link —'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Vị trí: {p.position} · Hiện sau {p.display_delay_seconds}s · Ẩn {p.dismiss_duration_hours}h
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => toggleActive(p)} title={p.is_active ? 'Đang bật' : 'Đang tắt'}>
                {p.is_active ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setEditing(p)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
