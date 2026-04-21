import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePersonalMealPlans, PersonalMealPlan } from '@/hooks/usePersonalMealPlans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Pencil, Upload, Eye, EyeOff } from 'lucide-react';

type EditState = Partial<PersonalMealPlan> & { _new?: boolean; _itemsText?: string };

const AdminPersonalMealPlans = () => {
  const { plans, loading, fetchAll } = usePersonalMealPlans(false);
  const { toast } = useToast();
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const startNew = () => setEditing({
    _new: true,
    guest_count: 2,
    name: '',
    price: 0,
    items: [],
    _itemsText: '',
    image_url: null,
    note: '',
    is_active: true,
    sort_order: 0,
  });

  const startEdit = (p: PersonalMealPlan) => setEditing({
    ...p,
    _itemsText: (p.items || []).join('\n'),
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(10);
    const ext = file.name.split('.').pop();
    const path = `meal-plans/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    setUploadProgress(40);
    const { error } = await supabase.storage.from('dining').upload(path, file, { upsert: false });
    setUploadProgress(80);
    if (error) {
      toast({ title: 'Lỗi tải ảnh', description: error.message, variant: 'destructive' });
      setUploading(false); setUploadProgress(0);
      return;
    }
    const { data } = supabase.storage.from('dining').getPublicUrl(path);
    setEditing(e => e ? { ...e, image_url: data.publicUrl } : e);
    setUploadProgress(100);
    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 400);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name?.trim() || !editing.guest_count || editing.guest_count < 1) {
      toast({ title: 'Vui lòng nhập số người ăn (≥1) và tên suất', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const items = (editing._itemsText || '').split('\n').map(s => s.trim()).filter(Boolean);
    const payload = {
      guest_count: editing.guest_count,
      name: editing.name.trim(),
      price: editing.price || 0,
      items,
      image_url: editing.image_url || null,
      note: editing.note || null,
      is_active: editing.is_active !== false,
      sort_order: editing.sort_order || 0,
    };
    const { error } = editing._new
      ? await (supabase as any).from('personal_meal_plans').insert(payload)
      : await (supabase as any).from('personal_meal_plans').update(payload).eq('id', editing.id);
    setSaving(false);
    if (error) { toast({ title: 'Lỗi lưu', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Đã lưu ✓' });
    setEditing(null);
    fetchAll();
  };

  const remove = async (id: string) => {
    if (!confirm('Xoá suất ăn này?')) return;
    const { error } = await (supabase as any).from('personal_meal_plans').delete().eq('id', id);
    if (error) { toast({ title: 'Lỗi xoá', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Đã xoá ✓' });
    fetchAll();
  };

  const toggle = async (p: PersonalMealPlan) => {
    await (supabase as any).from('personal_meal_plans').update({ is_active: !p.is_active }).eq('id', p.id);
    fetchAll();
  };

  if (loading) return <div className="p-4">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-primary/10 border-l-4 border-primary rounded-lg p-4 text-sm">
        <p className="font-semibold text-foreground">Suất ăn theo số người</p>
        <p className="text-muted-foreground mt-1">
          <strong>Suất ăn theo số người</strong>: hiện cho MỌI khách, bao nhiêu người cũng được.<br />
          <strong>Combo 225k–550k</strong>: chỉ tự động hiện khi khách ≥ 6 người.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Quản lý suất ăn theo số người ({plans.length})</h2>
        <Button onClick={startNew} variant="gold" className="gap-1"><Plus className="h-4 w-4" /> Thêm suất mới</Button>
      </div>

      {/* Editor */}
      {editing && (
        <div className="bg-card border-2 border-primary/40 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing._new ? 'Thêm suất ăn mới' : 'Chỉnh sửa suất ăn'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Số người ăn *</label>
              <Input type="number" min={1} value={editing.guest_count || 1} onChange={e => setEditing({ ...editing, guest_count: parseInt(e.target.value) || 1 })} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Thứ tự</label>
              <Input type="number" value={editing.sort_order || 0} onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Tên suất *</label>
              <Input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder='VD: "Suất cơ bản 2 người"' maxLength={150} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Giá (đồng) *</label>
              <Input type="number" min={0} value={editing.price || 0} onChange={e => setEditing({ ...editing, price: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-end gap-2">
              <Switch checked={editing.is_active !== false} onCheckedChange={v => setEditing({ ...editing, is_active: v })} />
              <span className="text-sm">{editing.is_active !== false ? 'Đang hiện' : 'Đang ẩn'}</span>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Danh sách món (mỗi dòng 1 món)</label>
              <Textarea
                value={editing._itemsText || ''}
                onChange={e => setEditing({ ...editing, _itemsText: e.target.value })}
                placeholder={'Cá hồi nướng\nSalad rau\nCanh rong biển'}
                rows={5}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Ghi chú</label>
              <Input value={editing.note || ''} onChange={e => setEditing({ ...editing, note: e.target.value })} placeholder="Ghi chú nội bộ hoặc gợi ý cho khách" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground block">Ảnh</label>
              <div className="flex items-center gap-3">
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1">
                  <Upload className="h-4 w-4" /> {uploading ? `Đang tải... ${uploadProgress}%` : 'Chọn ảnh'}
                </Button>
                {editing.image_url && (
                  <>
                    <img src={editing.image_url} alt="preview" className="h-16 w-24 object-cover rounded border border-border" />
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditing({ ...editing, image_url: null })}>Xoá ảnh</Button>
                  </>
                )}
              </div>
              {uploading && (
                <div className="h-1.5 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button onClick={save} disabled={saving} variant="gold" className="gap-1">
              <Save className="h-4 w-4" /> {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Hủy</Button>
          </div>
        </div>
      )}

      {/* Grid */}
      {plans.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
          Chưa có suất ăn nào. Bấm "Thêm suất mới" để bắt đầu.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(p => (
            <div key={p.id} className={`bg-card border rounded-xl overflow-hidden transition-all ${p.is_active ? 'border-border' : 'border-dashed border-border opacity-60'}`}>
              {p.image_url && <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-32 object-cover" />}
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase font-bold text-primary">{p.guest_count} người</p>
                    <h4 className="font-semibold text-sm">{p.name}</h4>
                  </div>
                  <span className="text-primary font-bold text-sm whitespace-nowrap">{p.price.toLocaleString('vi-VN')}đ</span>
                </div>
                {p.items.length > 0 && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{p.items.join(' • ')}</p>
                )}
                <div className="flex gap-1 pt-2 border-t border-border">
                  <Button size="sm" variant="ghost" className="flex-1 gap-1" onClick={() => startEdit(p)}>
                    <Pencil className="h-3 w-3" /> Sửa
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggle(p)} title={p.is_active ? 'Ẩn' : 'Hiện'}>
                    {p.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(p.id)} title="Xoá">
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPersonalMealPlans;
