import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2 } from 'lucide-react';

const KEYS = [
  'intro_title',
  'intro_description',
  'intro_photo_1_url',
  'intro_photo_1_caption',
  'intro_photo_2_url',
  'intro_photo_2_caption',
  'intro_photo_3_url',
  'intro_photo_3_caption',
] as const;

type Form = Record<(typeof KEYS)[number], string>;

const PhotoUploader = ({
  value,
  onChange,
  uploading,
  progress,
  onUpload,
  onClear,
  imgKey,
}: {
  value: string;
  onChange: (v: string) => void;
  uploading: boolean;
  progress: number;
  onUpload: (file: File) => void;
  onClear: () => void;
  imgKey: number;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) onUpload(f);
      }}
      onClick={() => !uploading && ref.current?.click()}
      className="border-2 border-dashed border-[#C9A84C]/40 hover:border-[#C9A84C] rounded-lg p-4 text-center cursor-pointer bg-[#C9A84C]/5 transition"
    >
      {value ? (
        <div className="relative inline-block">
          <img
            key={imgKey}
            src={value}
            alt="preview"
            className="max-h-40 rounded-md mx-auto"
            style={{ animation: 'introImgIn 0.5s ease-out' }}
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-7 w-7 p-0 rounded-full"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : uploading ? (
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#C9A84C]" />
      ) : (
        <div className="space-y-1">
          <Upload className="h-6 w-6 mx-auto text-[#C9A84C]" />
          <p className="text-sm font-medium">Kéo ảnh vào đây hoặc click chọn</p>
          <p className="text-[11px] text-muted-foreground">Ảnh 1920×1080 hoặc 4:3 · tối đa 5MB</p>
        </div>
      )}
      {uploading && (
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-[#C9A84C] transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
      />
    </div>
  );
};

const AdminIntroSection = () => {
  const { settings, updateSetting, refetch } = useSiteSettings();
  const { toast } = useToast();
  const [form, setForm] = useState<Form>({
    intro_title: '',
    intro_description: '',
    intro_photo_1_url: '',
    intro_photo_1_caption: '',
    intro_photo_2_url: '',
    intro_photo_2_caption: '',
    intro_photo_3_url: '',
    intro_photo_3_caption: '',
  });
  const [uploading, setUploading] = useState<{ idx: number; progress: number } | null>(null);
  const [imgKey, setImgKey] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    const next: Partial<Form> = {};
    KEYS.forEach((k) => { (next as any)[k] = (settings as any)[k] || ''; });
    setForm((f) => ({ ...f, ...next }));
  }, [settings]);

  const upload = async (file: File, idx: number) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File quá lớn', description: 'Tối đa 5MB', variant: 'destructive' });
      return;
    }
    setUploading({ idx, progress: 10 });
    const timer = setInterval(() => {
      setUploading((u) => (u ? { ...u, progress: Math.min(85, u.progress + 8) } : null));
    }, 120);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `intro-${idx}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('site-assets').upload(path, file, { upsert: true });
    clearInterval(timer);
    if (error) {
      toast({ title: 'Lỗi upload', description: error.message, variant: 'destructive' });
      setUploading(null);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(path);
    const key = `intro_photo_${idx}_url` as keyof Form;
    setForm((f) => ({ ...f, [key]: publicUrl }));
    setImgKey((k) => k + 1);
    setUploading({ idx, progress: 100 });
    setTimeout(() => setUploading(null), 400);
    toast({ title: '✓ Ảnh đã tải lên thành công' });
  };

  const save = async () => {
    setSaving(true);
    for (const k of KEYS) {
      await updateSetting(k, form[k]);
    }
    refetch();
    setSaving(false);
    toast({ title: '✓ Đã lưu thay đổi — trang chủ sẽ tự cập nhật' });
  };

  const charCount = form.intro_description.length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Section "Kỳ Nghỉ Ngập Tràn Niềm Vui"</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Chỉnh tiêu đề, mô tả và 3 ảnh giới thiệu trên trang chủ.
        </p>
      </div>

      <div className="space-y-4 bg-card border rounded-xl p-6">
        <div>
          <Label className="text-sm font-semibold">Tiêu đề section</Label>
          <Input
            value={form.intro_title}
            onChange={(e) => setForm({ ...form, intro_title: e.target.value })}
            placeholder="Kỳ Nghỉ Ngập Tràn Niềm Vui"
            className="mt-1 text-lg"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Đoạn mô tả</Label>
            <span className={`text-xs ${charCount > 350 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {charCount} ký tự (gợi ý 200–300)
            </span>
          </div>
          <Textarea
            value={form.intro_description}
            onChange={(e) => setForm({ ...form, intro_description: e.target.value })}
            rows={5}
            className="mt-1"
            placeholder="Nên 2–4 câu, khoảng 200–300 ký tự."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => {
          const urlKey = `intro_photo_${i}_url` as keyof Form;
          const capKey = `intro_photo_${i}_caption` as keyof Form;
          return (
            <div key={i} className="bg-card border rounded-xl p-4 space-y-3">
              <Label className="text-sm font-semibold">Ảnh {i}</Label>
              <PhotoUploader
                value={form[urlKey]}
                onChange={(v) => setForm({ ...form, [urlKey]: v })}
                uploading={uploading?.idx === i}
                progress={uploading?.idx === i ? uploading.progress : 0}
                onUpload={(f) => upload(f, i)}
                onClear={() => setForm({ ...form, [urlKey]: '' })}
                imgKey={imgKey}
              />
              <div>
                <Label className="text-xs">Caption</Label>
                <Input
                  value={form[capKey]}
                  onChange={(e) => setForm({ ...form, [capKey]: e.target.value })}
                  placeholder="VD: Hồ bơi vô cực — Tầng 6 · View biển FLC"
                  className="mt-1"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <Button
          onClick={save}
          disabled={saving}
          size="lg"
          className="bg-[#C9A84C] hover:bg-[#b8973f] text-[#1B3A5C] font-semibold gap-2 shadow-lg"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          LƯU THAY ĐỔI
        </Button>
      </div>

      <style>{`
        @keyframes introImgIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default AdminIntroSection;
