import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/compressImage';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, ImageIcon, Plus } from 'lucide-react';

const AdminAboutImages = () => {
  const { toast } = useToast();
  const { settings, updateSetting } = useSiteSettings();
  const [uploading, setUploading] = useState(false);
  const [gallery, setGallery] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = (settings as any).about_gallery_images;
      if (raw) {
        const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(arr)) setGallery(arr);
      }
    } catch { /* ignore */ }
  }, [settings.about_gallery_images]);

  const uploadFile = async (file: File, prefix: string): Promise<string | null> => {
    try {
      const blob = await compressImage(file, { maxWidth: 1600, quality: 0.8 });
      const path = `about/${prefix}-${Date.now()}.webp`;
      const { error } = await supabase.storage.from('site-assets').upload(path, blob, { upsert: true, contentType: 'image/webp' });
      if (error) throw error;
      const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
      return data.publicUrl;
    } catch (e: any) {
      toast({ title: 'Lỗi upload', description: e.message, variant: 'destructive' });
      return null;
    }
  };

  const handleSingleUpload = async (file: File, key: string) => {
    setUploading(true);
    const url = await uploadFile(file, key);
    if (url) {
      const err = await updateSetting(key, url);
      if (err) toast({ title: 'Lỗi lưu', variant: 'destructive' });
      else toast({ title: 'Đã cập nhật ✓' });
    }
    setUploading(false);
  };

  const handleGalleryAdd = async (files: FileList) => {
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadFile(file, 'gallery');
      if (url) newUrls.push(url);
    }
    if (newUrls.length) {
      const updated = [...gallery, ...newUrls];
      setGallery(updated);
      const err = await updateSetting('about_gallery_images', JSON.stringify(updated));
      if (err) toast({ title: 'Lỗi lưu', variant: 'destructive' });
      else toast({ title: `Đã thêm ${newUrls.length} ảnh ✓` });
    }
    setUploading(false);
  };

  const removeGalleryItem = async (idx: number) => {
    if (!confirm('Xóa ảnh này?')) return;
    const updated = gallery.filter((_, i) => i !== idx);
    setGallery(updated);
    await updateSetting('about_gallery_images', JSON.stringify(updated));
    toast({ title: 'Đã xóa ✓' });
  };

  const moveItem = async (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= gallery.length) return;
    const updated = [...gallery];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setGallery(updated);
    await updateSetting('about_gallery_images', JSON.stringify(updated));
  };

  const heroUrl = (settings as any).about_image_url;
  const storyUrl = (settings as any).about_story_image_url;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-display text-lg font-semibold mb-1">📸 Ảnh trang Giới thiệu</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload ảnh thực tế để hiển thị trên trang <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/gioi-thieu</code>.
        </p>

        {/* Hero */}
        <div className="border border-border rounded-lg p-4 mb-4">
          <label className="text-sm font-medium mb-2 block">Ảnh Hero (banner đầu trang, ngang)</label>
          {heroUrl && (
            <div className="mb-3 p-3 bg-secondary rounded-lg">
              <img src={heroUrl} alt="" className="w-full max-h-40 object-cover rounded-lg" />
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="relative" disabled={uploading}>
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSingleUpload(f, 'about_image_url'); }} />
            </Button>
            {heroUrl && (
              <Button variant="outline" size="sm" onClick={async () => { await updateSetting('about_image_url', ''); toast({ title: 'Đã xóa ✓' }); }}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Xóa
              </Button>
            )}
          </div>
        </div>

        {/* Story image */}
        <div className="border border-border rounded-lg p-4">
          <label className="text-sm font-medium mb-2 block">Ảnh "Câu chuyện thương hiệu" (4:3)</label>
          {storyUrl && (
            <div className="mb-3 p-3 bg-secondary rounded-lg">
              <img src={storyUrl} alt="" className="w-full max-h-40 object-cover rounded-lg" />
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="relative" disabled={uploading}>
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSingleUpload(f, 'about_story_image_url'); }} />
            </Button>
            {storyUrl && (
              <Button variant="outline" size="sm" onClick={async () => { await updateSetting('about_story_image_url', ''); toast({ title: 'Đã xóa ✓' }); }}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Xóa
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" /> Thư viện ảnh (Masonry)
            </h3>
            <p className="text-sm text-muted-foreground">Khuyên dùng 9–12 ảnh: hồ bơi, phòng, nhà hàng, view biển, món ăn.</p>
          </div>
          <Button variant="gold" size="sm" className="relative" disabled={uploading}>
            <Plus className="h-4 w-4 mr-1.5" /> Thêm ảnh
            <input type="file" accept="image/*" multiple className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => { if (e.target.files?.length) handleGalleryAdd(e.target.files); }} />
          </Button>
        </div>

        {gallery.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
            <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Chưa có ảnh — bấm "Thêm ảnh" để upload (có thể chọn nhiều).</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {gallery.map((url, i) => (
              <div key={url + i} className="relative group rounded-lg overflow-hidden border border-border bg-secondary">
                <img src={url} alt={`Gallery ${i + 1}`} className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  <div className="flex gap-1">
                    <button onClick={() => moveItem(i, -1)} disabled={i === 0} className="text-xs bg-white/90 text-black px-2 py-1 rounded disabled:opacity-30">←</button>
                    <button onClick={() => moveItem(i, 1)} disabled={i === gallery.length - 1} className="text-xs bg-white/90 text-black px-2 py-1 rounded disabled:opacity-30">→</button>
                  </div>
                  <button onClick={() => removeGalleryItem(i)} className="text-xs bg-destructive text-white px-2 py-1 rounded flex items-center gap-1">
                    <Trash2 className="h-3 w-3" /> Xóa
                  </button>
                </div>
                <span className="absolute top-1 left-1 text-[10px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded">#{i + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAboutImages;
