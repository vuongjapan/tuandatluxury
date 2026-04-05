import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/compressImage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Pencil, Trash2, Save } from 'lucide-react';
import AdminImageOptimizer from '@/components/AdminImageOptimizer';

type GalleryCategory = 'featured' | 'rooms' | 'restaurant' | 'wellness' | 'entertainment';

const GALLERY_CATEGORIES: { id: GalleryCategory; label: string }[] = [
  { id: 'featured', label: 'Nổi bật' },
  { id: 'rooms', label: 'Hạng phòng' },
  { id: 'restaurant', label: 'Nhà hàng & Ẩm thực' },
  { id: 'wellness', label: 'Chăm sóc sức khỏe' },
  { id: 'entertainment', label: 'Vui chơi giải trí' },
];

const AdminGallery = () => {
  const { toast } = useToast();
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [galleryCategory, setGalleryCategory] = useState<GalleryCategory>('featured');
  const [editingGalleryImage, setEditingGalleryImage] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchGalleryImages = async () => {
    const { data } = await supabase.from('gallery_images').select('*').order('sort_order');
    setGalleryImages(data || []);
  };

  useEffect(() => { fetchGalleryImages(); }, []);

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 1200, quality: 0.7 });
      const path = `${galleryCategory}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('gallery').upload(path, compressed);
      if (uploadError) { toast({ title: 'Lỗi upload ảnh', variant: 'destructive' }); setUploadingImage(false); return; }
      const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(path);
      await supabase.from('gallery_images').insert({
        category: galleryCategory, image_url: urlData.publicUrl,
        title_vi: '', title_en: '',
        sort_order: galleryImages.filter(g => g.category === galleryCategory).length,
      });
      toast({ title: 'Đã thêm ảnh ✓' });
      fetchGalleryImages();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    }
    setUploadingImage(false);
    e.target.value = '';
  };

  const updateGalleryImage = async () => {
    if (!editingGalleryImage) return;
    await supabase.from('gallery_images').update({
      title_vi: editingGalleryImage.title_vi, title_en: editingGalleryImage.title_en,
      sort_order: editingGalleryImage.sort_order, is_active: editingGalleryImage.is_active,
      category: editingGalleryImage.category,
    }).eq('id', editingGalleryImage.id);
    toast({ title: 'Đã cập nhật ✓' });
    setEditingGalleryImage(null);
    fetchGalleryImages();
  };

  const deleteGalleryImage = async (id: string) => {
    if (!confirm('Xóa ảnh này?')) return;
    await supabase.from('gallery_images').delete().eq('id', id);
    toast({ title: 'Đã xóa ✓' });
    fetchGalleryImages();
  };

  const filteredImages = galleryImages.filter(g => g.category === galleryCategory);

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-4">
        <AdminImageOptimizer />
      </div>

      <div className="flex flex-wrap gap-2">
        {GALLERY_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setGalleryCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${galleryCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent border border-border'}`}>
            {cat.label} ({galleryImages.filter(g => g.category === cat.id).length})
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">{GALLERY_CATEGORIES.find(c => c.id === galleryCategory)?.label}</h3>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} disabled={uploadingImage} />
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              <Upload className="h-4 w-4" /> {uploadingImage ? 'Đang tải...' : 'Thêm ảnh'}
            </span>
          </label>
        </div>

        {editingGalleryImage && (
          <div className="bg-secondary rounded-xl p-4 mb-4 border-2 border-primary">
            <h4 className="font-semibold mb-3">Chỉnh sửa ảnh</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Tiêu đề (VI)</label>
                <Input value={editingGalleryImage.title_vi || ''} onChange={e => setEditingGalleryImage({ ...editingGalleryImage, title_vi: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Danh mục</label>
                <Select value={editingGalleryImage.category} onValueChange={v => setEditingGalleryImage({ ...editingGalleryImage, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GALLERY_CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground uppercase font-semibold mb-1 block">Thứ tự</label>
                  <Input type="number" value={editingGalleryImage.sort_order} onChange={e => setEditingGalleryImage({ ...editingGalleryImage, sort_order: +e.target.value })} />
                </div>
                <label className="flex items-center gap-2 text-sm pb-2">
                  <input type="checkbox" checked={editingGalleryImage.is_active} onChange={e => setEditingGalleryImage({ ...editingGalleryImage, is_active: e.target.checked })} />
                  Hiện
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="hero" size="sm" onClick={updateGalleryImage}><Save className="h-4 w-4 mr-1" />Lưu</Button>
              <Button variant="outline" size="sm" onClick={() => setEditingGalleryImage(null)}>Hủy</Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredImages.map(img => (
            <div key={img.id} className="group relative rounded-xl overflow-hidden border border-border">
              <img src={img.image_url} alt={img.title_vi || ''} className="w-full aspect-[4/3] object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => setEditingGalleryImage(img)} className="p-2 bg-white/20 rounded-full hover:bg-white/40">
                  <Pencil className="h-4 w-4 text-white" />
                </button>
                <button onClick={() => deleteGalleryImage(img.id)} className="p-2 bg-red-500/50 rounded-full hover:bg-red-500/80">
                  <Trash2 className="h-4 w-4 text-white" />
                </button>
              </div>
              {!img.is_active && <span className="absolute top-2 left-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">Ẩn</span>}
              {img.title_vi && <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">{img.title_vi}</p>}
            </div>
          ))}
        </div>
        {filteredImages.length === 0 && <p className="text-center text-muted-foreground py-8">Chưa có ảnh trong danh mục này.</p>}
      </div>
    </div>
  );
};

export default AdminGallery;
