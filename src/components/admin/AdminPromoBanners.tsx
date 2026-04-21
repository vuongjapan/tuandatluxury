import { useState } from 'react';
import { Plus, Trash2, Save, Eye, EyeOff, ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePromoBanners, type PromoBanner } from '@/hooks/usePromoBanners';

type EditableBanner = Partial<PromoBanner> & {
  bullets_vi: string[];
  bullets_en: string[];
};

const emptyBanner = (): EditableBanner => ({
  title_vi: 'Ở CÀNG NHIỀU — ƯU ĐÃI CÀNG CAO',
  title_en: 'STAY MORE — SAVE MORE',
  badge_vi: 'ƯU ĐÃI HÈ 2026',
  badge_en: 'SUMMER 2026',
  bullets_vi: ['', '', '', ''],
  bullets_en: ['', '', '', ''],
  image_url: '',
  cta_label_vi: 'Xem chi tiết →',
  cta_label_en: 'View details →',
  cta_link: '/khuyen-mai',
  sort_order: 0,
  start_date: null,
  end_date: null,
  is_active: true,
});

export default function AdminPromoBanners() {
  const { banners, isLoading, refetch } = usePromoBanners();
  const [editing, setEditing] = useState<EditableBanner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const startEdit = (b: PromoBanner) => {
    setEditing({
      ...b,
      bullets_vi: [...b.bullets_vi, '', '', '', ''].slice(0, 4),
      bullets_en: [...b.bullets_en, '', '', '', ''].slice(0, 4),
    });
  };

  const handleUpload = async (file: File) => {
    if (!editing) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh tối đa 5MB');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `banner-${Date.now()}.${ext}`;
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
    setSaving(true);
    try {
      const payload = {
        title_vi: editing.title_vi || '',
        title_en: editing.title_en || '',
        badge_vi: editing.badge_vi || '',
        badge_en: editing.badge_en || '',
        bullets_vi: editing.bullets_vi.filter((b) => b.trim()),
        bullets_en: editing.bullets_en.filter((b) => b.trim()),
        image_url: editing.image_url || null,
        cta_label_vi: editing.cta_label_vi || '',
        cta_label_en: editing.cta_label_en || '',
        cta_link: editing.cta_link || '/',
        sort_order: editing.sort_order ?? 0,
        start_date: editing.start_date || null,
        end_date: editing.end_date || null,
        is_active: editing.is_active ?? true,
      };
      if (editing.id) {
        const { error } = await (supabase as any).from('promo_banners').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('promo_banners').insert(payload);
        if (error) throw error;
      }
      toast.success('Đã lưu banner');
      setEditing(null);
      refetch();
    } catch (e: any) {
      toast.error('Lưu thất bại: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xoá banner này?')) return;
    const { error } = await (supabase as any).from('promo_banners').delete().eq('id', id);
    if (error) {
      toast.error('Xoá thất bại');
      return;
    }
    toast.success('Đã xoá');
    refetch();
  };

  const toggleActive = async (b: PromoBanner) => {
    const { error } = await (supabase as any)
      .from('promo_banners')
      .update({ is_active: !b.is_active })
      .eq('id', b.id);
    if (error) {
      toast.error('Cập nhật thất bại');
      return;
    }
    refetch();
  };

  const toDateInput = (iso: string | null | undefined) => {
    if (!iso) return '';
    return new Date(iso).toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-semibold text-[#1B3A5C]">Banner Ưu đãi (Trang chủ)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý banner "Ưu đãi Hè 2026" và các banner khuyến mãi khác hiển thị trên trang chủ.
          </p>
        </div>
        <Button
          onClick={() => setEditing(emptyBanner())}
          className="bg-[#C9A84C] hover:bg-[#B89640] text-white gap-2"
        >
          <Plus className="h-4 w-4" /> Thêm banner mới
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
          Chưa có banner. Bấm "Thêm banner mới" để tạo.
        </div>
      ) : (
        <div className="grid gap-4">
          {banners.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-4 p-4 bg-card border rounded-lg hover:shadow-md transition-shadow"
            >
              {b.image_url && (
                <img
                  src={b.image_url}
                  alt=""
                  className="w-32 h-20 object-cover rounded-md shrink-0"
                  onError={(e) => ((e.target as HTMLImageElement).src = '/placeholder.svg')}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#C9A84C]/15 text-[#8a7228] font-semibold">
                    {b.badge_vi}
                  </span>
                  {!b.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Đã ẩn</span>
                  )}
                </div>
                <h3 className="font-semibold text-[#1B3A5C] truncate">{b.title_vi}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {b.bullets_vi.length} ưu đãi · CTA: {b.cta_link}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => toggleActive(b)} title={b.is_active ? 'Ẩn' : 'Hiện'}>
                  {b.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => startEdit(b)}>
                  Sửa
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(b.id)} className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-auto">
          <div className="bg-background rounded-xl max-w-3xl w-full my-8 max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-display font-semibold">
                {editing.id ? 'Sửa banner' : 'Thêm banner mới'}
              </h3>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Đóng
              </Button>
            </div>

            <div className="p-6 space-y-5">
              {/* Image upload */}
              <div>
                <Label>Ảnh nền (1200×800px, tối đa 5MB)</Label>
                <div className="mt-2 border-2 border-dashed rounded-lg p-4 text-center hover:border-[#C9A84C] transition-colors">
                  {editing.image_url ? (
                    <div className="relative inline-block animate-[scale-in_0.4s_ease-out]">
                      <img src={editing.image_url} alt="" className="max-h-40 rounded" />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1"
                        onClick={() => setEditing({ ...editing, image_url: '' })}
                      >
                        Xoá
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 py-4">
                      {uploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
                      ) : (
                        <ImagePlus className="h-8 w-8 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {uploading ? 'Đang tải lên...' : 'Click để chọn ảnh'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                      />
                    </label>
                  )}
                </div>
                <Input
                  className="mt-2"
                  placeholder="Hoặc dán URL ảnh"
                  value={editing.image_url || ''}
                  onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tiêu đề (VI)</Label>
                  <Input
                    value={editing.title_vi || ''}
                    onChange={(e) => setEditing({ ...editing, title_vi: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tiêu đề (EN)</Label>
                  <Input
                    value={editing.title_en || ''}
                    onChange={(e) => setEditing({ ...editing, title_en: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Badge (VI)</Label>
                  <Input
                    value={editing.badge_vi || ''}
                    onChange={(e) => setEditing({ ...editing, badge_vi: e.target.value })}
                    placeholder="ƯU ĐÃI HÈ 2026"
                  />
                </div>
                <div>
                  <Label>Badge (EN)</Label>
                  <Input
                    value={editing.badge_en || ''}
                    onChange={(e) => setEditing({ ...editing, badge_en: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>4 dòng ưu đãi (Tiếng Việt)</Label>
                  {editing.bullets_vi.map((b, i) => (
                    <Input
                      key={i}
                      className="mt-2"
                      value={b}
                      onChange={(e) => {
                        const arr = [...editing.bullets_vi];
                        arr[i] = e.target.value;
                        setEditing({ ...editing, bullets_vi: arr });
                      }}
                      placeholder={`Ưu đãi ${i + 1}`}
                    />
                  ))}
                </div>
                <div>
                  <Label>4 dòng ưu đãi (English)</Label>
                  {editing.bullets_en.map((b, i) => (
                    <Input
                      key={i}
                      className="mt-2"
                      value={b}
                      onChange={(e) => {
                        const arr = [...editing.bullets_en];
                        arr[i] = e.target.value;
                        setEditing({ ...editing, bullets_en: arr });
                      }}
                      placeholder={`Benefit ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Chữ nút CTA (VI)</Label>
                  <Input
                    value={editing.cta_label_vi || ''}
                    onChange={(e) => setEditing({ ...editing, cta_label_vi: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Chữ nút CTA (EN)</Label>
                  <Input
                    value={editing.cta_label_en || ''}
                    onChange={(e) => setEditing({ ...editing, cta_label_en: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Link nút</Label>
                  <Input
                    value={editing.cta_link || ''}
                    onChange={(e) => setEditing({ ...editing, cta_link: e.target.value })}
                    placeholder="/khuyen-mai"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Bắt đầu hiển thị</Label>
                  <Input
                    type="datetime-local"
                    value={toDateInput(editing.start_date)}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        start_date: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Hết hạn</Label>
                  <Input
                    type="datetime-local"
                    value={toDateInput(editing.end_date)}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        end_date: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Thứ tự</Label>
                  <Input
                    type="number"
                    value={editing.sort_order ?? 0}
                    onChange={(e) => setEditing({ ...editing, sort_order: +e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={editing.is_active ?? true}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                />
                <Label htmlFor="active" className="!mt-0">
                  Hiển thị banner trên trang chủ
                </Label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Huỷ
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#C9A84C] hover:bg-[#B89640] text-white gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Lưu banner
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
