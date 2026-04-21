import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/compressImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Save, Trash2, Upload, Pencil, Eye, EyeOff,
  Search, X, Star, StarOff, ImageIcon, DollarSign
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface MenuItem {
  id: string;
  name_vi: string;
  name_en: string;
  description_vi: string | null;
  description_en: string | null;
  price_vnd: number;
  price_type: 'fixed' | 'negotiable';
  category: string;
  image_url: string | null;
  is_popular: boolean;
  is_active: boolean;
  is_combo: boolean;
  show_price: boolean;
  sort_order: number;
}

const CATEGORIES: Record<string, string> = {
  breakfast: 'Ăn sáng',
  main: 'Cơm',
  seafood: 'Hải sản',
  shellfish: 'Hàu - Sò - Ngao',
  hotpot: 'Lẩu',
  fish: 'Cá',
  chicken: 'Gà',
  meat: 'Thịt',
  soup: 'Canh',
  vegetable: 'Rau & Đậu phụ',
  snack: 'Ăn vặt',
  other: 'Món khác',
  combo: 'Set Menu / Combo',
  drinks: 'Đồ uống',
};

const EMPTY_ITEM: Omit<MenuItem, 'id'> = {
  name_vi: '',
  name_en: '',
  description_vi: '',
  description_en: '',
  price_vnd: 0,
  price_type: 'fixed',
  category: 'main',
  image_url: null,
  is_popular: false,
  is_active: true,
  is_combo: false,
  show_price: true,
  sort_order: 0,
};

const AdminFoodMenu = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState<Omit<MenuItem, 'id'>>(EMPTY_ITEM);
  const [uploading, setUploading] = useState(false);
  const [bulkUploading, setBulkUploading] = useState<string | null>(null);
  // Price variants
  const [priceEditingId, setPriceEditingId] = useState<string | null>(null);
  const [priceVariants, setPriceVariants] = useState<any[]>([]);
  const [priceLoading, setPriceLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .order('sort_order');
    setItems((data as MenuItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter(item => {
    if (filterCat !== 'all' && item.category !== filterCat) return false;
    if (search) {
      const s = search.toLowerCase();
      return item.name_vi.toLowerCase().includes(s) || item.name_en.toLowerCase().includes(s);
    }
    return true;
  });

  const handleUploadImage = async (file: File, itemId?: string): Promise<string | null> => {
    try {
      const compressed = await compressImage(file);
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `menu/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('dining').upload(path, compressed);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('dining').getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err: any) {
      toast({ title: 'Lỗi upload ảnh', description: err.message, variant: 'destructive' });
      return null;
    }
  };

  const handleSaveNew = async () => {
    if (!newItem.name_vi.trim()) {
      toast({ title: 'Vui lòng nhập tên món', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('menu_items').insert([newItem]);
    if (error) {
      toast({ title: 'Lỗi thêm món', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Đã thêm món mới' });
    setAdding(false);
    setNewItem(EMPTY_ITEM);
    fetchItems();
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const { id, ...rest } = editing;
    const { error } = await supabase.from('menu_items').update(rest).eq('id', id);
    if (error) {
      toast({ title: 'Lỗi cập nhật', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Đã cập nhật món ăn' });
    setEditing(null);
    fetchItems();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa "${name}"?`)) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) {
      toast({ title: 'Lỗi xóa', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Đã xóa món ăn' });
    fetchItems();
  };

  const handleToggleActive = async (item: MenuItem) => {
    await supabase.from('menu_items').update({ is_active: !item.is_active }).eq('id', item.id);
    fetchItems();
  };

  const handleTogglePopular = async (item: MenuItem) => {
    await supabase.from('menu_items').update({ is_popular: !item.is_popular }).eq('id', item.id);
    fetchItems();
  };

  const handleQuickImageUpload = async (itemId: string, file: File) => {
    setBulkUploading(itemId);
    const url = await handleUploadImage(file, itemId);
    if (url) {
      await supabase.from('menu_items').update({ image_url: url }).eq('id', itemId);
      toast({ title: 'Đã cập nhật ảnh' });
      fetchItems();
    }
    setBulkUploading(null);
  };

  const renderForm = (
    data: Omit<MenuItem, 'id'> | MenuItem,
    onChange: (updates: Partial<MenuItem>) => void,
    onSave: () => void,
    onCancel: () => void,
    isNew: boolean
  ) => (
    <div className="bg-card border rounded-xl p-4 space-y-4 mb-4">
      <h3 className="font-semibold text-lg">{isNew ? '➕ Thêm món mới' : '✏️ Sửa món'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Tên Tiếng Việt *</label>
          <Input value={data.name_vi} onChange={e => onChange({ name_vi: e.target.value })} placeholder="Tên món tiếng Việt" />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Tên Tiếng Anh</label>
          <Input value={data.name_en} onChange={e => onChange({ name_en: e.target.value })} placeholder="English name" />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Giá (VNĐ){data.price_type === 'negotiable' ? ' — Bị ẩn vì giá thỏa thuận' : ''}
          </label>
          <Input
            type="number"
            value={data.price_vnd}
            disabled={data.price_type === 'negotiable'}
            onChange={e => onChange({ price_vnd: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Kiểu giá</label>
          <div className="flex items-center gap-3 mt-2">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={data.price_type === 'negotiable'}
                onCheckedChange={(v) => onChange({ price_type: v ? 'negotiable' : 'fixed', ...(v ? { price_vnd: 0 } : {}) } as any)}
              />
              <span className="font-medium">
                {data.price_type === 'negotiable' ? '💬 Giá thỏa thuận' : '💰 Giá cố định'}
              </span>
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Bật nếu món tính tại nhà hàng (theo cân, theo mùa…). Khách sẽ thấy nhãn "Giá thỏa thuận".
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Danh mục</label>
          <Select value={data.category} onValueChange={v => onChange({ category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Thứ tự sắp xếp</label>
          <Input type="number" value={data.sort_order} onChange={e => onChange({ sort_order: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={data.is_popular} onCheckedChange={v => onChange({ is_popular: v })} />
            Món phổ biến
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={data.is_active} onCheckedChange={v => onChange({ is_active: v })} />
            Hiển thị
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={(data as any).is_combo} onCheckedChange={v => onChange({ is_combo: v } as any)} />
            Là combo
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={(data as any).show_price !== false} onCheckedChange={v => onChange({ show_price: v } as any)} />
            Hiện giá
          </label>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground">Mô tả tiếng Việt</label>
        <Textarea value={data.description_vi || ''} onChange={e => onChange({ description_vi: e.target.value })} rows={2} />
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground">Mô tả tiếng Anh</label>
        <Textarea value={data.description_en || ''} onChange={e => onChange({ description_en: e.target.value })} rows={2} />
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground">Ảnh món ăn</label>
        <div className="flex items-center gap-3 mt-1">
          {data.image_url && (
            <img src={data.image_url} alt="" className="w-20 h-20 object-cover rounded-lg border" />
          )}
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-sm">
              <Upload className="h-4 w-4" />
              {uploading ? 'Đang tải...' : 'Chọn ảnh'}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                const url = await handleUploadImage(file);
                if (url) onChange({ image_url: url });
                setUploading(false);
              }}
            />
          </label>
          {data.image_url && (
            <Button variant="ghost" size="sm" onClick={() => onChange({ image_url: null })}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={onSave} className="gap-2">
          <Save className="h-4 w-4" /> Lưu
        </Button>
        <Button variant="outline" onClick={onCancel}>Hủy</Button>
      </div>
    </div>
  );

  const formatPrice = (p: number) => p === 0 ? 'Giá thỏa thuận' : `${p.toLocaleString('vi-VN')}₫`;

  const categoryCounts = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Price variant functions
  const fetchPriceVariants = async (menuItemId: string) => {
    setPriceLoading(true);
    const { data } = await supabase
      .from('menu_item_prices')
      .select('*')
      .eq('menu_item_id', menuItemId)
      .order('sort_order');
    setPriceVariants(data || []);
    setPriceLoading(false);
  };

  const handleOpenPriceEditor = async (itemId: string) => {
    if (priceEditingId === itemId) {
      setPriceEditingId(null);
      return;
    }
    setPriceEditingId(itemId);
    await fetchPriceVariants(itemId);
  };

  const handleAddPriceVariant = async () => {
    if (!priceEditingId) return;
    const { error } = await supabase.from('menu_item_prices').insert({
      menu_item_id: priceEditingId,
      label_vi: 'Mới',
      label_en: 'New',
      price_vnd: 0,
      sort_order: priceVariants.length,
    });
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchPriceVariants(priceEditingId);
  };

  const handleUpdatePriceVariant = async (id: string, updates: any) => {
    await supabase.from('menu_item_prices').update(updates).eq('id', id);
    if (priceEditingId) await fetchPriceVariants(priceEditingId);
  };

  const handleDeletePriceVariant = async (id: string) => {
    if (!confirm('Xóa mức giá này?')) return;
    await supabase.from('menu_item_prices').delete().eq('id', id);
    if (priceEditingId) await fetchPriceVariants(priceEditingId);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">🍽️ Quản lý Menu Đồ ăn</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{items.length} món</Badge>
          <Button onClick={() => { setAdding(true); setEditing(null); }} className="gap-2" size="sm">
            <Plus className="h-4 w-4" /> Thêm món
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(CATEGORIES).map(([key, label]) => {
          const count = categoryCounts[key] || 0;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setFilterCat(filterCat === key ? 'all' : key)}
              className={`p-3 rounded-lg border text-left transition-all ${filterCat === key ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-secondary'}`}
            >
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-lg font-bold">{count}</div>
            </button>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm món ăn..."
            className="pl-10"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        {filterCat !== 'all' && (
          <Button variant="outline" size="sm" onClick={() => setFilterCat('all')} className="gap-1">
            <X className="h-3 w-3" /> Bỏ lọc
          </Button>
        )}
      </div>

      {/* Add form */}
      {adding && renderForm(
        newItem,
        updates => setNewItem(prev => ({ ...prev, ...updates })),
        handleSaveNew,
        () => { setAdding(false); setNewItem(EMPTY_ITEM); },
        true
      )}

      {/* Edit form */}
      {editing && renderForm(
        editing,
        updates => setEditing(prev => prev ? { ...prev, ...updates } : prev),
        handleSaveEdit,
        () => setEditing(null),
        false
      )}

      {/* Items list */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Hiển thị {filtered.length} / {items.length} món</p>
          <div className="grid gap-2">
            {filtered.map(item => (
              <div key={item.id} className="space-y-0">
                <div
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${!item.is_active ? 'opacity-50 bg-muted' : 'bg-card hover:shadow-sm'}`}
                >
                {/* Image */}
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-secondary shrink-0 group">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name_vi} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
                    {bulkUploading === item.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 text-white" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleQuickImageUpload(item.id, file);
                      }}
                    />
                  </label>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{item.name_vi}</span>
                    {item.is_popular && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{item.name_en}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs py-0">{CATEGORIES[item.category] || item.category}</Badge>
                    <span className="text-xs font-medium text-primary">{formatPrice(item.price_vnd)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenPriceEditor(item.id)} title="Quản lý mức giá">
                    <DollarSign className={`h-4 w-4 ${priceEditingId === item.id ? 'text-primary' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTogglePopular(item)} title={item.is_popular ? 'Bỏ phổ biến' : 'Đánh dấu phổ biến'}>
                    {item.is_popular ? <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> : <StarOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(item)} title={item.is_active ? 'Ẩn' : 'Hiện'}>
                    {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(item); setAdding(false); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id, item.name_vi)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Price variants editor */}
              {priceEditingId === item.id && (
                <div className="mt-2 p-3 bg-secondary/50 rounded-lg border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold flex items-center gap-1">
                      <DollarSign className="h-4 w-4" /> Mức giá cho &quot;{item.name_vi}&quot;
                    </h4>
                    <Button size="sm" variant="outline" onClick={handleAddPriceVariant} className="gap-1 text-xs">
                      <Plus className="h-3 w-3" /> Thêm giá
                    </Button>
                  </div>
                  {priceLoading ? (
                    <div className="text-center py-2 text-xs text-muted-foreground">Đang tải...</div>
                  ) : priceVariants.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Chưa có mức giá. Món sẽ dùng giá mặc định ({formatPrice(item.price_vnd)}).</p>
                  ) : (
                    <div className="space-y-1.5">
                      {priceVariants.map((v: any) => (
                        <div key={v.id} className="flex items-center gap-2">
                          <Input
                            value={v.label_vi}
                            onChange={e => {
                              setPriceVariants(prev => prev.map(p => p.id === v.id ? { ...p, label_vi: e.target.value } : p));
                            }}
                            onBlur={() => handleUpdatePriceVariant(v.id, { label_vi: v.label_vi })}
                            placeholder="Tên VN (VD: Nhỏ)"
                            className="h-8 text-xs flex-1"
                          />
                          <Input
                            value={v.label_en}
                            onChange={e => {
                              setPriceVariants(prev => prev.map(p => p.id === v.id ? { ...p, label_en: e.target.value } : p));
                            }}
                            onBlur={() => handleUpdatePriceVariant(v.id, { label_en: v.label_en })}
                            placeholder="Tên EN (VD: Small)"
                            className="h-8 text-xs flex-1"
                          />
                          <Input
                            type="number"
                            value={v.price_vnd}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              setPriceVariants(prev => prev.map(p => p.id === v.id ? { ...p, price_vnd: val } : p));
                            }}
                            onBlur={() => handleUpdatePriceVariant(v.id, { price_vnd: v.price_vnd })}
                            placeholder="Giá"
                            className="h-8 text-xs w-28"
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => handleDeletePriceVariant(v.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">💡 Khi có mức giá, khách phải chọn mức giá trước khi thêm vào giỏ. Mỗi mức giá = 1 dòng riêng.</p>
                </div>
              )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFoodMenu;
