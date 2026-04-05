import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAttractions, Attraction } from '@/hooks/useAttractions';
import { compressImage } from '@/lib/compressImage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Trash2, Plus, Save, GripVertical } from 'lucide-react';

const AdminAttractions = () => {
  const { toast } = useToast();
  const { attractions, refetch } = useAttractions();
  const [editing, setEditing] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const handleAdd = async () => {
    const { error } = await supabase.from('nearby_attractions').insert({
      name_vi: 'Điểm tham quan mới',
      name_en: 'New Attraction',
      distance: '',
      icon: '📍',
      sort_order: attractions.length,
    } as any);
    if (error) { toast({ title: 'Lỗi', variant: 'destructive' }); return; }
    toast({ title: 'Đã thêm ✓' });
    refetch();
  };

  const handleUpdate = async (id: string, updates: Partial<Attraction>) => {
    const { error } = await supabase.from('nearby_attractions').update(updates as any).eq('id', id);
    if (error) { toast({ title: 'Lỗi cập nhật', variant: 'destructive' }); return; }
    toast({ title: 'Đã lưu ✓' });
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa điểm tham quan này?')) return;
    await supabase.from('nearby_attractions').delete().eq('id', id);
    toast({ title: 'Đã xóa ✓' });
    refetch();
  };

  const handleUploadImage = async (id: string, file: File) => {
    setUploading(id);
    try {
      const blob = await compressImage(file, { maxWidth: 1200, quality: 0.8 });
      const path = `attractions/${id}-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from('site-assets').upload(path, blob, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);
      await handleUpdate(id, { image_url: urlData.publicUrl } as any);
    } catch (err: any) {
      toast({ title: 'Lỗi upload', description: err.message, variant: 'destructive' });
    }
    setUploading(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">🗺️ Điểm tham quan lân cận</h3>
        <Button variant="gold" size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" /> Thêm điểm
        </Button>
      </div>

      <div className="space-y-3">
        {attractions.map((a) => (
          <div key={a.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start gap-4">
              {/* Image */}
              <div className="w-32 h-20 shrink-0 rounded-lg overflow-hidden bg-muted relative group">
                {a.image_url ? (
                  <img src={a.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">{a.icon}</div>
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                  <Upload className="h-5 w-5 text-white" />
                  <input type="file" accept="image/*" className="hidden" disabled={uploading === a.id}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadImage(a.id, f); }} />
                </label>
              </div>

              {/* Fields */}
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Input defaultValue={a.icon} placeholder="Icon" className="text-center text-lg"
                    onBlur={(e) => handleUpdate(a.id, { icon: e.target.value } as any)} />
                  <Input defaultValue={a.name_vi} placeholder="Tên (VI)"
                    onBlur={(e) => handleUpdate(a.id, { name_vi: e.target.value } as any)} />
                  <Input defaultValue={a.name_en} placeholder="Name (EN)"
                    onBlur={(e) => handleUpdate(a.id, { name_en: e.target.value } as any)} />
                  <Input defaultValue={a.distance} placeholder="Khoảng cách"
                    onBlur={(e) => handleUpdate(a.id, { distance: e.target.value } as any)} />
                </div>
                <Textarea defaultValue={a.description_vi || ''} placeholder="Mô tả (VI) - nội dung giới thiệu điểm tham quan" rows={2}
                  onBlur={(e) => handleUpdate(a.id, { description_vi: e.target.value } as any)} />
                <Textarea defaultValue={a.description_en || ''} placeholder="Description (EN)" rows={2}
                  onBlur={(e) => handleUpdate(a.id, { description_en: e.target.value } as any)} />
              </div>

              {/* Actions */}
              <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} className="shrink-0 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAttractions;
