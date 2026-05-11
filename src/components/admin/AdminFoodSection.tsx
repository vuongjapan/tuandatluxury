import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';

interface SlideItem { url: string; caption?: string }
interface FeatureItem { icon: string; vi: string; en: string }

const ICON_OPTIONS = ['Fish', 'Utensils', 'Users', 'Wine'];

const DEFAULT_FEATURES: FeatureItem[] = [
  { icon: 'Fish', vi: 'Hải sản tươi sống — đánh bắt hàng ngày', en: 'Fresh seafood — caught daily' },
  { icon: 'Utensils', vi: '120+ món từ 89.000đ/người', en: '120+ dishes from 89,000đ/person' },
  { icon: 'Users', vi: 'Thực đơn theo nhóm 1–20+ người', en: 'Group menus for 1–20+ people' },
  { icon: 'Wine', vi: 'Rooftop Bar tầng 6 — view biển', en: 'Rooftop Bar 6F — sea view' },
];

const SECTION_KEY = 'home_food';
const BUCKET = 'site-assets';

const AdminFoodSection = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [descVi, setDescVi] = useState('');
  const [descEn, setDescEn] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [slideshow, setSlideshow] = useState<SlideItem[]>([]);
  const [gallery, setGallery] = useState<SlideItem[]>([]);
  const [features, setFeatures] = useState<FeatureItem[]>(DEFAULT_FEATURES);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('page_sections')
      .select('*')
      .eq('section_key', SECTION_KEY)
      .maybeSingle();
    if (data) {
      setDescVi(data.description_vi || '');
      setDescEn(data.description_en || '');
      setVideoUrl(data.video_url || '');
      setSlideshow((data.slideshow as any[])?.map((s: any) => typeof s === 'string' ? { url: s } : s) || []);
      setGallery((data.gallery as any[]) || []);
      const feats = (data.features as any[]) || [];
      if (feats.length > 0) setFeatures(feats);
    }
    setLoading(false);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `home-food/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
    if (error) {
      toast({ title: 'Lỗi upload', description: error.message, variant: 'destructive' });
      return null;
    }
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  };

  const handleAddSlide = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      const url = await uploadFile(f);
      if (url) setSlideshow(prev => [...prev, { url }]);
    }
    e.target.value = '';
  };

  const handleGalleryUpload = async (idx: number, file: File) => {
    const url = await uploadFile(file);
    if (!url) return;
    setGallery(prev => {
      const next = [...prev];
      next[idx] = { ...(next[idx] || { caption: '' }), url };
      return next;
    });
  };

  const ensureGalleryRow = (idx: number) => {
    setGallery(prev => {
      if (prev[idx]) return prev;
      const next = [...prev];
      while (next.length <= idx) next.push({ url: '', caption: '' });
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      section_key: SECTION_KEY,
      description_vi: descVi || null,
      description_en: descEn || null,
      video_url: videoUrl || null,
      slideshow: slideshow as any,
      gallery: gallery as any,
      features: features as any,
    };
    const { error } = await supabase
      .from('page_sections')
      .upsert(payload, { onConflict: 'section_key' });
    setSaving(false);
    if (error) {
      toast({ title: 'Lỗi lưu', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Đã lưu Section Ẩm Thực ✓' });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-6 w-6" /></div>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="bg-card border rounded-xl p-5">
        <h3 className="font-semibold mb-3">Mô tả nhà hàng</h3>
        <div className="space-y-3">
          <div>
            <Label>Tiếng Việt</Label>
            <Textarea rows={3} value={descVi} onChange={e => setDescVi(e.target.value)} placeholder="Nhà hàng Tuấn Đạt phục vụ hải sản..." />
          </div>
          <div>
            <Label>English</Label>
            <Textarea rows={3} value={descEn} onChange={e => setDescEn(e.target.value)} placeholder="Tuấn Đạt Restaurant serves fresh seafood..." />
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Slideshow ảnh chính (cột trái)</h3>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90">
            <Upload className="h-4 w-4" /> Upload ảnh
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddSlide} />
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {slideshow.map((s, i) => (
            <div key={i} className="relative group">
              <img src={s.url} alt="" className="w-full h-24 object-cover rounded-md border" />
              <button
                onClick={() => setSlideshow(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {slideshow.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Chưa có ảnh — sẽ dùng ảnh từ Thư viện ảnh (category: restaurant).</p>}
        </div>
      </div>

      <div className="bg-card border rounded-xl p-5">
        <h3 className="font-semibold mb-3">Gallery 4 ảnh (hàng dưới)</h3>
        <div className="space-y-3">
          {[0, 1, 2, 3].map(idx => {
            const item = gallery[idx];
            return (
              <div key={idx} className="flex items-center gap-3 border rounded-md p-2">
                <div className="w-20 h-16 bg-muted rounded overflow-hidden shrink-0">
                  {item?.url ? <img src={item.url} className="w-full h-full object-cover" alt="" /> : null}
                </div>
                <label className="text-xs cursor-pointer bg-secondary px-2 py-1 rounded hover:bg-secondary/80">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        ensureGalleryRow(idx);
                        await handleGalleryUpload(idx, f);
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
                <Input
                  placeholder={`Caption ảnh ${idx + 1}`}
                  value={item?.caption || ''}
                  onChange={e => {
                    setGallery(prev => {
                      const next = [...prev];
                      while (next.length <= idx) next.push({ url: '', caption: '' });
                      next[idx] = { ...next[idx], caption: e.target.value };
                      return next;
                    });
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card border rounded-xl p-5">
        <h3 className="font-semibold mb-3">Video (tuỳ chọn)</h3>
        <Input
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          placeholder="Link MP4 hoặc YouTube"
        />
      </div>

      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Tính năng hiển thị</h3>
          <Button variant="outline" size="sm" onClick={() => setFeatures(prev => [...prev, { icon: 'Fish', vi: '', en: '' }])}>
            <Plus className="h-4 w-4 mr-1" /> Thêm
          </Button>
        </div>
        <div className="space-y-2">
          {features.map((f, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <select
                className="col-span-2 border rounded-md h-10 px-2 bg-background"
                value={f.icon}
                onChange={e => {
                  const v = e.target.value;
                  setFeatures(prev => prev.map((p, idx) => idx === i ? { ...p, icon: v } : p));
                }}
              >
                {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
              <Input
                className="col-span-5"
                placeholder="Tiếng Việt"
                value={f.vi}
                onChange={e => setFeatures(prev => prev.map((p, idx) => idx === i ? { ...p, vi: e.target.value } : p))}
              />
              <Input
                className="col-span-4"
                placeholder="English"
                value={f.en}
                onChange={e => setFeatures(prev => prev.map((p, idx) => idx === i ? { ...p, en: e.target.value } : p))}
              />
              <button
                onClick={() => setFeatures(prev => prev.filter((_, idx) => idx !== i))}
                className="col-span-1 text-destructive hover:bg-destructive/10 rounded p-2"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 sticky bottom-3 bg-background/80 backdrop-blur p-3 rounded-lg border">
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Lưu thay đổi
        </Button>
        <Button variant="outline" onClick={() => window.open('/', '_blank')}>Xem trước</Button>
      </div>
    </div>
  );
};

export default AdminFoodSection;
