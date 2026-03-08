import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/compressImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Save, Trash2, Upload, Pencil, Eye, EyeOff,
  GripVertical, UtensilsCrossed, X
} from 'lucide-react';

interface DiningCategory {
  id: string;
  slug: string;
  name_vi: string;
  name_en: string;
  description_vi: string | null;
  description_en: string | null;
  image_url: string | null;
  serving_hours: string | null;
  sort_order: number;
  is_active: boolean;
}

interface DiningItem {
  id: string;
  category_id: string;
  name_vi: string;
  name_en: string;
  description_vi: string | null;
  description_en: string | null;
  image_url: string | null;
  price_vnd: number;
  is_combo: boolean;
  combo_serves: number | null;
  sort_order: number;
  is_active: boolean;
}

const AdminDining = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<DiningCategory[]>([]);
  const [items, setItems] = useState<DiningItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [editingCat, setEditingCat] = useState<DiningCategory | null>(null);
  const [editingItem, setEditingItem] = useState<DiningItem | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [newItem, setNewItem] = useState({
    name_vi: '', name_en: '', description_vi: '', description_en: '',
    price_vnd: 0, is_combo: false, combo_serves: null as number | null,
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [{ data: cats }, { data: its }] = await Promise.all([
      supabase.from('dining_categories').select('*').order('sort_order'),
      supabase.from('dining_items').select('*').order('sort_order'),
    ]);
    setCategories((cats as DiningCategory[]) || []);
    setItems((its as DiningItem[]) || []);
    if (!selectedCat && cats && cats.length > 0) setSelectedCat(cats[0].id);
  };

  // Category image upload
  const uploadCatImage = async (e: React.ChangeEvent<HTMLInputElement>, catId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const compressed = await compressImage(file, { maxWidth: 800, quality: 0.7 });
    const path = `categories/${catId}-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('dining').upload(path, compressed);
    if (error) { toast({ title: 'Lỗi upload', variant: 'destructive' }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('dining').getPublicUrl(path);
    await supabase.from('dining_categories').update({ image_url: urlData.publicUrl }).eq('id', catId);
    toast({ title: 'Đã cập nhật ảnh ✓' });
    fetchAll();
    setUploading(false);
    e.target.value = '';
  };

  // Item image upload
  const uploadItemImage = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `items/${itemId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('dining').upload(path, file);
    if (error) { toast({ title: 'Lỗi upload', variant: 'destructive' }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('dining').getPublicUrl(path);
    await supabase.from('dining_items').update({ image_url: urlData.publicUrl }).eq('id', itemId);
    toast({ title: 'Đã cập nhật ảnh món ✓' });
    if (editingItem?.id === itemId) setEditingItem({ ...editingItem, image_url: urlData.publicUrl });
    fetchAll();
    setUploading(false);
    e.target.value = '';
  };

  // Save category
  const saveCat = async () => {
    if (!editingCat) return;
    const { error } = await supabase.from('dining_categories').update({
      name_vi: editingCat.name_vi,
      name_en: editingCat.name_en,
      description_vi: editingCat.description_vi,
      description_en: editingCat.description_en,
      serving_hours: editingCat.serving_hours,
      sort_order: editingCat.sort_order,
      is_active: editingCat.is_active,
    }).eq('id', editingCat.id);
    if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
    toast({ title: 'Đã lưu mục ✓' });
    setEditingCat(null);
    fetchAll();
  };

  // Add item
  const addItem = async () => {
    if (!selectedCat || !newItem.name_vi) return;
    const catItems = items.filter(i => i.category_id === selectedCat);
    const { error } = await supabase.from('dining_items').insert({
      category_id: selectedCat,
      name_vi: newItem.name_vi,
      name_en: newItem.name_en || newItem.name_vi,
      description_vi: newItem.description_vi || null,
      description_en: newItem.description_en || null,
      price_vnd: newItem.price_vnd,
      is_combo: newItem.is_combo,
      combo_serves: newItem.is_combo ? newItem.combo_serves : null,
      sort_order: catItems.length,
    });
    if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Đã thêm món ✓' });
    setNewItem({ name_vi: '', name_en: '', description_vi: '', description_en: '', price_vnd: 0, is_combo: false, combo_serves: null });
    setAddingItem(false);
    fetchAll();
  };

  // Save item
  const saveItem = async () => {
    if (!editingItem) return;
    const { error } = await supabase.from('dining_items').update({
      name_vi: editingItem.name_vi,
      name_en: editingItem.name_en,
      description_vi: editingItem.description_vi,
      description_en: editingItem.description_en,
      price_vnd: editingItem.price_vnd,
      is_combo: editingItem.is_combo,
      combo_serves: editingItem.is_combo ? editingItem.combo_serves : null,
      sort_order: editingItem.sort_order,
      is_active: editingItem.is_active,
    }).eq('id', editingItem.id);
    if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
    toast({ title: 'Đã lưu món ✓' });
    setEditingItem(null);
    fetchAll();
  };

  // Delete item
  const deleteItem = async (id: string) => {
    if (!confirm('Xóa món này?')) return;
    await supabase.from('dining_items').delete().eq('id', id);
    toast({ title: 'Đã xóa ✓' });
    fetchAll();
  };

  // Toggle item active
  const toggleItemActive = async (id: string, current: boolean) => {
    await supabase.from('dining_items').update({ is_active: !current }).eq('id', id);
    fetchAll();
  };

  // Toggle category active
  const toggleCatActive = async (id: string, current: boolean) => {
    await supabase.from('dining_categories').update({ is_active: !current }).eq('id', id);
    fetchAll();
  };

  const catItems = items.filter(i => i.category_id === selectedCat);

  return (
    <div className="space-y-6">
      {/* Categories management */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-display text-lg font-semibold mb-4">
          <UtensilsCrossed className="h-5 w-5 inline mr-2 text-primary" />
          Quản lý mục ẩm thực
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {categories.map(cat => (
            <div key={cat.id} className={`rounded-xl border p-4 transition-all ${
              selectedCat === cat.id ? 'border-primary bg-primary/5' : 'border-border'
            }`}>
              <div className="flex items-start gap-3">
                <div className="w-16 h-12 rounded-lg bg-secondary overflow-hidden shrink-0">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UtensilsCrossed className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{cat.name_vi}</h4>
                  <p className="text-xs text-muted-foreground truncate">{cat.name_en}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{cat.serving_hours}</p>
                </div>
              </div>
              <div className="flex gap-1 mt-3">
                <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={() => setSelectedCat(cat.id)}>
                  Xem món
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setEditingCat(cat)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => toggleCatActive(cat.id, cat.is_active)}>
                  {cat.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={e => uploadCatImage(e, cat.id)} disabled={uploading} />
                  <span className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-card hover:bg-secondary text-muted-foreground">
                    <Upload className="h-3 w-3" />
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Edit category form */}
        {editingCat && (
          <div className="border-2 border-primary rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Chỉnh sửa: {editingCat.name_vi}</h4>
              <Button variant="ghost" size="sm" onClick={() => setEditingCat(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Tên (VI)</label>
                <Input value={editingCat.name_vi} onChange={e => setEditingCat({ ...editingCat, name_vi: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Tên (EN)</label>
                <Input value={editingCat.name_en} onChange={e => setEditingCat({ ...editingCat, name_en: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Mô tả (VI)</label>
                <Textarea value={editingCat.description_vi || ''} onChange={e => setEditingCat({ ...editingCat, description_vi: e.target.value })} rows={2} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Mô tả (EN)</label>
                <Textarea value={editingCat.description_en || ''} onChange={e => setEditingCat({ ...editingCat, description_en: e.target.value })} rows={2} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Giờ phục vụ</label>
                <Input value={editingCat.serving_hours || ''} onChange={e => setEditingCat({ ...editingCat, serving_hours: e.target.value })} placeholder="06:00 - 22:00" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Thứ tự</label>
                <Input type="number" value={editingCat.sort_order} onChange={e => setEditingCat({ ...editingCat, sort_order: +e.target.value })} />
              </div>
            </div>
            <Button variant="hero" className="mt-3" onClick={saveCat}><Save className="h-4 w-4 mr-2" />Lưu</Button>
          </div>
        )}
      </div>

      {/* Items management */}
      {selectedCat && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">
              Món ăn: {categories.find(c => c.id === selectedCat)?.name_vi}
            </h3>
            <Button variant="hero" size="sm" onClick={() => setAddingItem(true)}>
              <Plus className="h-4 w-4 mr-1" /> Thêm món
            </Button>
          </div>

          {/* Add item form */}
          {addingItem && (
            <div className="border-2 border-primary rounded-xl p-4 mb-4">
              <h4 className="font-semibold mb-3">Thêm món mới</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Tên món (VI) *</label>
                  <Input value={newItem.name_vi} onChange={e => setNewItem({ ...newItem, name_vi: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Tên món (EN)</label>
                  <Input value={newItem.name_en} onChange={e => setNewItem({ ...newItem, name_en: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Mô tả (VI)</label>
                  <Textarea value={newItem.description_vi} onChange={e => setNewItem({ ...newItem, description_vi: e.target.value })} rows={2} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Mô tả (EN)</label>
                  <Textarea value={newItem.description_en} onChange={e => setNewItem({ ...newItem, description_en: e.target.value })} rows={2} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Giá (VND)</label>
                  <Input type="number" value={newItem.price_vnd} onChange={e => setNewItem({ ...newItem, price_vnd: +e.target.value })} />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={newItem.is_combo} onChange={e => setNewItem({ ...newItem, is_combo: e.target.checked })} />
                    Là combo
                  </label>
                  {newItem.is_combo && (
                    <div>
                      <label className="text-xs text-muted-foreground">Phục vụ (người)</label>
                      <Input type="number" className="w-20" value={newItem.combo_serves || ''} onChange={e => setNewItem({ ...newItem, combo_serves: +e.target.value || null })} />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="hero" onClick={addItem}><Plus className="h-4 w-4 mr-1" />Thêm</Button>
                <Button variant="outline" onClick={() => setAddingItem(false)}>Hủy</Button>
              </div>
            </div>
          )}

          {/* Edit item form */}
          {editingItem && (
            <div className="border-2 border-primary rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Chỉnh sửa: {editingItem.name_vi}</h4>
                <Button variant="ghost" size="sm" onClick={() => setEditingItem(null)}><X className="h-4 w-4" /></Button>
              </div>
              {/* Image */}
              <div className="mb-3 flex items-center gap-3">
                {editingItem.image_url && <img src={editingItem.image_url} alt="" className="w-20 h-14 rounded-lg object-cover border border-border" />}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={e => uploadItemImage(e, editingItem.id)} disabled={uploading} />
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">
                    <Upload className="h-3 w-3" /> {uploading ? 'Đang tải...' : 'Upload ảnh'}
                  </span>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Tên (VI)</label>
                  <Input value={editingItem.name_vi} onChange={e => setEditingItem({ ...editingItem, name_vi: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Tên (EN)</label>
                  <Input value={editingItem.name_en} onChange={e => setEditingItem({ ...editingItem, name_en: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Mô tả (VI)</label>
                  <Textarea value={editingItem.description_vi || ''} onChange={e => setEditingItem({ ...editingItem, description_vi: e.target.value })} rows={2} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Mô tả (EN)</label>
                  <Textarea value={editingItem.description_en || ''} onChange={e => setEditingItem({ ...editingItem, description_en: e.target.value })} rows={2} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Giá (VND)</label>
                  <Input type="number" value={editingItem.price_vnd} onChange={e => setEditingItem({ ...editingItem, price_vnd: +e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Thứ tự</label>
                  <Input type="number" value={editingItem.sort_order} onChange={e => setEditingItem({ ...editingItem, sort_order: +e.target.value })} />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editingItem.is_combo} onChange={e => setEditingItem({ ...editingItem, is_combo: e.target.checked })} />
                    Là combo
                  </label>
                  {editingItem.is_combo && (
                    <Input type="number" className="w-20" placeholder="Người" value={editingItem.combo_serves || ''} onChange={e => setEditingItem({ ...editingItem, combo_serves: +e.target.value || null })} />
                  )}
                </div>
              </div>
              <Button variant="hero" className="mt-3" onClick={saveItem}><Save className="h-4 w-4 mr-2" />Lưu</Button>
            </div>
          )}

          {/* Items list */}
          <div className="space-y-2">
            {catItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                <div className="w-14 h-10 rounded-lg bg-secondary overflow-hidden shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UtensilsCrossed className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{item.name_vi}</span>
                    {item.is_combo && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">COMBO</span>
                    )}
                    {!item.is_active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-semibold">Ẩn</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.name_en}</p>
                </div>
                <span className="font-bold text-sm text-primary shrink-0">
                  {item.price_vnd.toLocaleString('vi')}₫
                </span>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingItem(item)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleItemActive(item.id, item.is_active)}>
                    {item.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </Button>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={e => uploadItemImage(e, item.id)} disabled={uploading} />
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-secondary text-muted-foreground">
                      <Upload className="h-3 w-3" />
                    </span>
                  </label>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteItem(item.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            {catItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Chưa có món nào. Nhấn "Thêm món" để bắt đầu.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDining;
