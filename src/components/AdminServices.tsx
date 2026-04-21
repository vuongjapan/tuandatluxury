import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Pencil, Eye, EyeOff, GripVertical, Trash2, Upload, X, Loader2 } from 'lucide-react';
import type { Service } from '@/hooks/useServices';

const BADGE_OPTIONS = [
  { value: 'free', label: 'Miễn phí (gold)', text: 'Miễn phí', color: 'gold' },
  { value: 'request', label: 'Theo yêu cầu (navy)', text: 'Theo yêu cầu', color: 'navy' },
  { value: 'none', label: 'Không có', text: '', color: '' },
];
const EFFECT_OPTIONS = [
  { value: 'zoom', label: 'Zoom khi hover (mặc định)' },
  { value: 'parallax', label: 'Parallax cuộn' },
  { value: 'fade', label: 'Fade in' },
  { value: 'slide', label: 'Slide từ dưới lên' },
];

const emptyForm = {
  id: '', name: '', description: '', badge_choice: 'free', image_url: '',
  image_effect: 'zoom', button_text: 'Khám phá →', button_link: '',
  is_featured: true, is_active: true,
};

const AdminServices = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imgKey, setImgKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragIdx = useRef<number | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from('services').select('*').order('sort_order');
    if (error) toast({ title: 'Lỗi tải', description: error.message, variant: 'destructive' });
    else setItems((data || []) as Service[]);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const openNew = () => { setForm({ ...emptyForm }); setOpen(true); };

  const openEdit = (s: Service) => {
    const choice = s.badge_text === 'Miễn phí' ? 'free' : s.badge_text === 'Theo yêu cầu' ? 'request' : 'none';
    setForm({
      id: s.id, name: s.name, description: s.description || '',
      badge_choice: choice, image_url: s.image_url || '',
      image_effect: s.image_effect || 'zoom',
      button_text: s.button_text || '', button_link: s.button_link || '',
      is_featured: s.is_featured, is_active: s.is_active,
    });
    setOpen(true);
  };

  const toggleActive = async (s: Service) => {
    const { error } = await (supabase as any).from('services').update({ is_active: !s.is_active }).eq('id', s.id);
    if (error) toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    else { toast({ title: !s.is_active ? '✓ Đã hiển thị' : 'Đã ẩn' }); fetchItems(); }
  };

  const remove = async (s: Service) => {
    if (!confirm(`Xóa "${s.name}"?`)) return;
    const { error } = await (supabase as any).from('services').delete().eq('id', s.id);
    if (error) toast({ title: 'Lỗi xóa', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Đã xóa' }); fetchItems(); }
  };

  const onDragStart = (i: number) => (dragIdx.current = i);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = async (i: number) => {
    const from = dragIdx.current; dragIdx.current = null;
    if (from === null || from === i) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    setItems(next);
    await Promise.all(next.map((s, idx) =>
      (supabase as any).from('services').update({ sort_order: idx + 1 }).eq('id', s.id)
    ));
    toast({ title: '✓ Đã cập nhật thứ tự' });
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: 'File quá lớn (tối đa 5MB)', variant: 'destructive' }); return; }
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) { toast({ title: 'Định dạng không hỗ trợ', variant: 'destructive' }); return; }
    setUploading(true); setUploadProgress(10);
    const timer = setInterval(() => setUploadProgress((p) => (p < 85 ? p + 8 : p)), 120);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('service-images').upload(path, file, { cacheControl: '3600', upsert: false });
    clearInterval(timer);
    if (error) { setUploading(false); setUploadProgress(0); toast({ title: 'Lỗi upload', description: error.message, variant: 'destructive' }); return; }
    const { data: { publicUrl } } = supabase.storage.from('service-images').getPublicUrl(path);
    setUploadProgress(100);
    setForm((f) => ({ ...f, image_url: publicUrl }));
    setImgKey((k) => k + 1);
    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 400);
    toast({ title: '✓ Ảnh đã tải lên thành công' });
  };

  const onDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const save = async () => {
    if (!form.name.trim()) { toast({ title: 'Vui lòng nhập tên', variant: 'destructive' }); return; }
    const badge = BADGE_OPTIONS.find((b) => b.value === form.badge_choice)!;
    const payload = {
      name: form.name.trim(), description: form.description.trim(),
      badge_text: badge.text || null, badge_color: badge.color || null,
      image_url: form.image_url || null, image_effect: form.image_effect,
      button_text: form.button_text.trim() || null, button_link: form.button_link.trim() || null,
      is_featured: form.is_featured, is_active: form.is_active,
    };
    if (form.id) {
      const { error } = await (supabase as any).from('services').update(payload).eq('id', form.id);
      if (error) { toast({ title: 'Lỗi lưu', description: error.message, variant: 'destructive' }); return; }
      toast({ title: '✓ Đã lưu' });
    } else {
      const nextOrder = items.length ? Math.max(...items.map((i) => i.sort_order)) + 1 : 1;
      const { error } = await (supabase as any).from('services').insert({ ...payload, sort_order: nextOrder });
      if (error) { toast({ title: 'Lỗi tạo', description: error.message, variant: 'destructive' }); return; }
      toast({ title: '✓ Đã tạo dịch vụ mới' });
    }
    setOpen(false);
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quản lý Dịch vụ</h2>
          <p className="text-sm text-muted-foreground mt-1">Kéo thả ⠿ để đổi thứ tự. Toggle ẩn/hiện ngay.</p>
        </div>
        <Button onClick={openNew} className="bg-[#C9A84C] hover:bg-[#b8973f] text-[#1B3A5C] font-semibold gap-2">
          <Plus className="h-4 w-4" />Thêm dịch vụ mới
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <p className="text-muted-foreground">Chưa có dịch vụ nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((s, i) => (
            <div
              key={s.id}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(i)}
              className={`relative bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all ${!s.is_active ? 'opacity-60' : ''}`}
            >
              <div className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-background/90 rounded p-1 shadow">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex gap-3 p-3">
                {s.image_url ? (
                  <img src={s.image_url} alt={s.name} className="w-[120px] h-[80px] object-cover rounded-md flex-shrink-0" />
                ) : (
                  <div className="w-[120px] h-[80px] bg-muted rounded-md flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{s.name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {s.badge_text && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.badge_color === 'navy' ? 'bg-[#1B3A5C] text-white' : 'bg-[#C9A84C] text-[#1B3A5C]'}`}>
                        {s.badge_text}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">{s.is_featured ? 'Hàng lớn' : 'Hàng nhỏ'}</span>
                    <span className="text-[10px] text-muted-foreground">· {s.image_effect}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(s)} className="h-8 gap-1">
                  <Pencil className="h-3.5 w-3.5" /> Sửa
                </Button>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(s)} className="h-8 gap-1" title={s.is_active ? 'Ẩn' : 'Hiện'}>
                    {s.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(s)} className="h-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{form.id ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-5 mt-6">
            <div>
              <Label>Tên dịch vụ *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Hồ Bơi Vô Cực" />
            </div>
            <div>
              <Label>Ảnh dịch vụ</Label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDropFile}
                onClick={() => !uploading && fileRef.current?.click()}
                className="mt-1 border-2 border-dashed border-[#C9A84C]/40 hover:border-[#C9A84C] rounded-lg p-6 text-center cursor-pointer bg-[#C9A84C]/5 transition"
              >
                {form.image_url ? (
                  <div className="relative inline-block">
                    <img key={imgKey} src={form.image_url} alt="preview" className="max-h-48 rounded-md mx-auto" style={{ animation: 'serviceImgIn 0.4s ease-out' }} />
                    <Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2 h-7 w-7 p-0 rounded-full"
                      onClick={(e) => { e.stopPropagation(); setForm({ ...form, image_url: '' }); }}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : uploading ? (
                  <div className="space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#C9A84C]" />
                    <p className="text-sm text-muted-foreground">Đang upload...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-[#C9A84C]" />
                    <p className="text-sm font-medium">Kéo ảnh vào đây hoặc click để chọn</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, WebP — tối đa 5MB</p>
                  </div>
                )}
                {uploading && (
                  <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-[#C9A84C] transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>
            </div>
            <div>
              <Label>Mô tả</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Mô tả 2–3 dòng..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Badge</Label>
                <Select value={form.badge_choice} onValueChange={(v) => setForm({ ...form, badge_choice: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BADGE_OPTIONS.map((b) => (<SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hiệu ứng ảnh</Label>
                <Select value={form.image_effect} onValueChange={(v) => setForm({ ...form, image_effect: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EFFECT_OPTIONS.map((e) => (<SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Chữ nút CTA</Label>
                <Input value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} placeholder="Khám phá →" />
              </div>
              <div>
                <Label>Link nút CTA</Label>
                <Input value={form.button_link} onChange={(e) => setForm({ ...form, button_link: e.target.value })} placeholder="/dich-vu hoặc tel:..." />
              </div>
            </div>
            <div>
              <Label>Vị trí hiển thị</Label>
              <RadioGroup value={form.is_featured ? 'featured' : 'minor'}
                onValueChange={(v) => setForm({ ...form, is_featured: v === 'featured' })}
                className="flex gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="featured" id="r-featured" />
                  <Label htmlFor="r-featured" className="cursor-pointer">Hàng lớn</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="minor" id="r-minor" />
                  <Label htmlFor="r-minor" className="cursor-pointer">Hàng icon nhỏ</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <Label htmlFor="active-toggle" className="cursor-pointer">Hiện trên web</Label>
              <Switch id="active-toggle" checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={save} className="flex-1 bg-[#C9A84C] hover:bg-[#b8973f] text-[#1B3A5C] font-semibold">LƯU</Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Hủy</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <style>{`@keyframes serviceImgIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
};

export default AdminServices;
