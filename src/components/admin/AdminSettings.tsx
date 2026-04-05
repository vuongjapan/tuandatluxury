import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/compressImage';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Trash2, Save, Eye, MapPin, ImageIcon, Download, UploadCloud } from 'lucide-react';
import { format } from 'date-fns';
import AdminAttractions from './AdminAttractions';

interface Props {
  onBackup: () => void;
  onRestore: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AdminSettings = ({ onBackup, onRestore }: Props) => {
  const { toast } = useToast();
  const { settings: siteSettings, updateSetting } = useSiteSettings();
  const [uploading, setUploading] = useState(false);
  const [mapEmbedCode, setMapEmbedCode] = useState('');
  const [mapSaving, setMapSaving] = useState(false);
  const [mapPreview, setMapPreview] = useState(false);

  useEffect(() => { setMapEmbedCode(siteSettings.map_embed_code || ''); }, [siteSettings.map_embed_code]);

  const saveMapEmbed = async () => {
    setMapSaving(true);
    const err = await updateSetting('map_embed_code', mapEmbedCode);
    setMapSaving(false);
    if (err) { toast({ title: 'Lỗi lưu bản đồ', variant: 'destructive' }); return; }
    toast({ title: 'Đã lưu bản đồ ✓' });
  };

  const uploadAsset = async (file: File, key: string, opts: { maxWidth?: number; quality?: number } = {}) => {
    setUploading(true);
    try {
      const isVideo = file.type.startsWith('video');
      let uploadBlob: Blob = file;
      if (!isVideo) {
        uploadBlob = await compressImage(file, { maxWidth: opts.maxWidth || 1200, quality: opts.quality || 0.75 });
      }
      const ext = isVideo ? 'mp4' : 'jpg';
      const path = `${key}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('site-assets').upload(path, uploadBlob, { upsert: true });
      if (upErr) { toast({ title: 'Lỗi upload', variant: 'destructive' }); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);
      const err = await updateSetting(`${key}_url`, urlData.publicUrl);
      if (err) toast({ title: 'Lỗi lưu', variant: 'destructive' });
      else toast({ title: 'Đã cập nhật ✓' });
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const deleteAsset = async (key: string) => {
    await updateSetting(`${key}_url`, '');
    toast({ title: 'Đã xóa ✓' });
  };

  interface AssetItem {
    key: string;
    label: string;
    accept: string;
    maxSize?: number;
    preview: string;
    maxWidth?: number;
  }

  interface AssetSection {
    title: string;
    desc: string;
    type?: 'text';
    items?: AssetItem[];
    fields?: { key: string; label: string; placeholder: string }[];
  }

  const sections: AssetSection[] = [
    {
      title: '🎬 Video Hero (đầu trang)',
      desc: 'Upload video MP4 autoplay hoặc ảnh nền fallback',
      items: [
        { key: 'hero_video', label: 'Video Hero', accept: 'video/mp4,video/webm', maxSize: 50 * 1024 * 1024, preview: 'video' },
        { key: 'hero_image', label: 'Ảnh nền Hero (fallback)', accept: 'image/*', preview: 'image' },
      ],
    },
    {
      title: '📝 Nội dung Hero',
      desc: 'Tiêu đề & slogan hiển thị trên trang chủ',
      type: 'text',
      fields: [
        { key: 'hero_title', label: 'Tiêu đề chính', placeholder: 'Tuấn Đạt Luxury' },
        { key: 'hero_subtitle', label: 'Phụ đề / Slogan', placeholder: 'Trải nghiệm nghỉ dưỡng đẳng cấp...' },
      ],
    },
    {
      title: '🏨 Hình ảnh website',
      desc: 'Upload ảnh cho các khu vực khác nhau',
      items: [
        { key: 'about_image', label: 'Ảnh "Về chúng tôi"', accept: 'image/*', preview: 'image' },
        { key: 'header_logo', label: 'Logo header (PNG trong suốt, 200×50px)', accept: 'image/*', preview: 'image', maxWidth: 400 },
        { key: 'chatbot_avatar', label: 'Avatar Chatbot Linh (200×200px)', accept: 'image/*', preview: 'avatar', maxWidth: 400 },
      ],
    },
    {
      title: '🏊 Ảnh giới thiệu (Về chúng tôi)',
      desc: 'Ảnh hồ bơi, nhà hàng, bar, lễ tân hiển thị trên trang chủ',
      items: [
        { key: 'feature_pool', label: 'Hồ bơi vô cực', accept: 'image/*', preview: 'image' },
        { key: 'feature_restaurant', label: '2 Nhà hàng', accept: 'image/*', preview: 'image' },
        { key: 'feature_bar', label: 'Rooftop Bar', accept: 'image/*', preview: 'image' },
        { key: 'feature_reception', label: 'Lễ tân 24/7', accept: 'image/*', preview: 'image' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Asset sections */}
      {sections.map((section, si) => (
        <div key={si} className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-display text-lg font-semibold mb-1">{section.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{section.desc}</p>

          {section.type === 'text' ? (
            <div className="space-y-3">
              {section.fields?.map(f => (
                <div key={f.key}>
                  <label className="text-xs text-muted-foreground">{f.label}</label>
                  <Input
                    placeholder={f.placeholder}
                    defaultValue={(siteSettings as any)[f.key] || ''}
                    onBlur={async (e) => {
                      await updateSetting(f.key, e.target.value);
                      toast({ title: 'Đã lưu ✓' });
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {section.items?.map(item => {
                const url = (siteSettings as any)[`${item.key}_url`];
                return (
                  <div key={item.key} className="border border-border rounded-lg p-4">
                    <label className="text-sm font-medium mb-2 block">{item.label}</label>
                    {url && (
                      <div className="mb-3 p-3 bg-secondary rounded-lg">
                        {item.preview === 'video' ? (
                          <video src={url} className="w-full max-h-32 rounded-lg object-cover" controls muted />
                        ) : item.preview === 'avatar' ? (
                          <img src={url} alt="" className="h-16 w-16 rounded-full object-cover" />
                        ) : (
                          <img src={url} alt="" className="w-full max-h-32 object-cover rounded-lg" />
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="relative" disabled={uploading}>
                        <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload
                        <input type="file" accept={item.accept} className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]; if (!file) return;
                            if (item.maxSize && file.size > item.maxSize) {
                              toast({ title: 'File quá lớn', variant: 'destructive' }); return;
                            }
                            await uploadAsset(file, item.key, { maxWidth: item.maxWidth });
                          }} />
                      </Button>
                      {url && (
                        <Button variant="outline" size="sm" onClick={() => deleteAsset(item.key)}>
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Xóa
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Map */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-display text-lg font-semibold mb-1 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" /> Bản đồ Google Maps
        </h3>
        <p className="text-sm text-muted-foreground mb-4">Dán mã nhúng iframe vào ô bên dưới.</p>
        <Textarea value={mapEmbedCode} onChange={e => setMapEmbedCode(e.target.value)} rows={4} className="font-mono text-xs" placeholder='<iframe src="..." ...></iframe>' />
        <div className="flex gap-2 mt-3">
          <Button variant="gold" onClick={saveMapEmbed} disabled={mapSaving}>
            <Save className="h-4 w-4 mr-2" /> {mapSaving ? 'Đang lưu...' : 'Lưu'}
          </Button>
          <Button variant="outline" onClick={() => setMapPreview(!mapPreview)}>
            <Eye className="h-4 w-4 mr-2" /> {mapPreview ? 'Ẩn' : 'Xem trước'}
          </Button>
        </div>
        {mapPreview && mapEmbedCode && (
          <div className="mt-4 rounded-lg overflow-hidden border border-border w-full aspect-video [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
            dangerouslySetInnerHTML={{ __html: mapEmbedCode }} />
        )}
      </div>

      {/* Điểm tham quan */}
      <AdminAttractions />

      {/* Backup */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-display text-lg font-semibold mb-1">💾 Sao lưu & Khôi phục</h3>
        <p className="text-sm text-muted-foreground mb-4">Xuất hoặc nhập dữ liệu hệ thống.</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBackup}>
            <Download className="h-4 w-4 mr-2" /> Xuất backup
          </Button>
          <Button variant="outline" className="relative">
            <UploadCloud className="h-4 w-4 mr-2" /> Nhập backup
            <input type="file" accept=".json" className="absolute inset-0 opacity-0 cursor-pointer" onChange={onRestore} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
