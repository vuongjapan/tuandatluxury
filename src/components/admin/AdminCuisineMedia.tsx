import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/compressImage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Trash2, Plus, Save, Image, Film, Eye, EyeOff, GripVertical } from 'lucide-react';

type MediaType = 'hero_video' | 'short_video' | 'image' | 'moment' | 'menu_photo';

interface CuisineMedia {
  id: string;
  type: string;
  title: string | null;
  caption: string | null;
  media_url: string;
  thumbnail_url: string | null;
  media_group: string | null;
  sort_order: number;
  is_active: boolean;
}

const MEDIA_TYPES: { value: MediaType; label: string }[] = [
  { value: 'hero_video', label: '🎬 Video Hero' },
  { value: 'short_video', label: '📱 Video ngắn (Reels)' },
  { value: 'image', label: '🖼️ Hình ảnh' },
  { value: 'moment', label: '📸 Moment khách' },
  { value: 'menu_photo', label: '📋 Ảnh menu / Đặc sản' },
];

const MENU_GROUPS = [
  { value: 'menu_le', label: 'Menu lẻ' },
  { value: 'menu_doan', label: 'Menu đoàn' },
  { value: 'combo', label: 'Combo' },
  { value: 'general', label: 'Chung' },
];

const AdminCuisineMedia = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeType, setActiveType] = useState<MediaType>('hero_video');
  const [uploading, setUploading] = useState(false);

  const { data: mediaItems = [], refetch } = useQuery({
    queryKey: ['cuisine-media-admin'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cuisine_media')
        .select('*')
        .order('sort_order');
      return (data || []) as CuisineMedia[];
    },
  });

  const filtered = mediaItems.filter(m => m.type === activeType);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith('video/');
        let uploadFile = file;
        
        if (!isVideo) {
          uploadFile = await compressImage(file);
        }

        const ext = uploadFile.name.split('.').pop();
        const fileName = `cuisine/${activeType}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from('site-assets')
          .upload(fileName, uploadFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('site-assets')
          .getPublicUrl(fileName);

        await supabase.from('cuisine_media').insert({
          type: activeType,
          media_url: urlData.publicUrl,
          title: file.name.replace(/\.[^/.]+$/, ''),
          media_group: activeType === 'menu_photo' ? 'general' : null,
          sort_order: filtered.length,
        } as any);
      }
      toast({ title: `Đã tải lên ${files.length} file ✓` });
      refetch();
    } catch (err: any) {
      toast({ title: 'Lỗi tải lên', description: err.message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const handleUpdate = async (id: string, updates: Partial<CuisineMedia>) => {
    const { error } = await supabase
      .from('cuisine_media')
      .update(updates as any)
      .eq('id', id);
    if (error) {
      toast({ title: 'Lỗi', variant: 'destructive' });
    } else {
      toast({ title: 'Đã lưu ✓' });
      refetch();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa vĩnh viễn?')) return;
    await supabase.from('cuisine_media').delete().eq('id', id);
    toast({ title: 'Đã xóa ✓' });
    refetch();
  };

  const handleToggle = async (id: string, current: boolean) => {
    await handleUpdate(id, { is_active: !current });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Quản lý Trang Ẩm thực</h2>
      </div>

      {/* Type tabs */}
      <div className="flex flex-wrap gap-2">
        {MEDIA_TYPES.map(mt => (
          <button
            key={mt.value}
            onClick={() => setActiveType(mt.value)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeType === mt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border hover:bg-secondary'
            }`}
          >
            {mt.label}
            <span className="ml-1 text-xs opacity-70">
              ({mediaItems.filter(m => m.type === mt.value).length})
            </span>
          </button>
        ))}
      </div>

      {/* Upload area */}
      <div className="bg-card rounded-xl border border-dashed border-border p-6 text-center">
        <input
          type="file"
          id="cuisine-upload"
          multiple
          accept={activeType.includes('video') ? 'video/*' : 'image/*'}
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <label
          htmlFor="cuisine-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          {uploading ? (
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {activeType.includes('video') 
                  ? 'Kéo thả hoặc click để tải video' 
                  : 'Kéo thả hoặc click để tải ảnh (nhiều file)'}
              </p>
              <p className="text-xs text-muted-foreground/60">Hỗ trợ tối đa 50MB/file</p>
            </>
          )}
        </label>
      </div>

      {/* URL input for video links */}
      {activeType.includes('video') && (
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm font-medium mb-2">Hoặc nhập link video:</p>
          <div className="flex gap-2">
            <Input
              id="video-url-input"
              placeholder="https://... (YouTube, MP4, ...)"
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={async () => {
                const input = document.getElementById('video-url-input') as HTMLInputElement;
                const url = input?.value?.trim();
                if (!url) return;
                await supabase.from('cuisine_media').insert({
                  type: activeType,
                  media_url: url,
                  title: 'Video',
                  sort_order: filtered.length,
                } as any);
                input.value = '';
                toast({ title: 'Đã thêm ✓' });
                refetch();
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Thêm
            </Button>
          </div>
        </div>
      )}

      {/* Media grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div key={item.id} className="bg-card rounded-xl border border-border overflow-hidden group">
            {/* Preview */}
            <div className="aspect-video bg-muted relative overflow-hidden">
              {item.type.includes('video') ? (
                item.media_url.includes('youtube') || item.media_url.includes('youtu.be') ? (
                  <iframe
                    src={item.media_url.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allow="autoplay"
                  />
                ) : (
                  <video
                    src={item.media_url}
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                  />
                )
              ) : (
                <img
                  src={item.media_url}
                  alt={item.title || ''}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
              {/* Toggle & Delete overlay */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleToggle(item.id, item.is_active)}
                  className={`p-1.5 rounded-full ${item.is_active ? 'bg-green-500' : 'bg-red-500'} text-white`}
                  title={item.is_active ? 'Đang hiện' : 'Đang ẩn'}
                >
                  {item.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-full bg-destructive text-white"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Edit fields */}
            <div className="p-3 space-y-2">
              <Input
                defaultValue={item.title || ''}
                placeholder="Tiêu đề"
                className="text-sm"
                onBlur={(e) => {
                  if (e.target.value !== (item.title || '')) {
                    handleUpdate(item.id, { title: e.target.value });
                  }
                }}
              />
              <Textarea
                defaultValue={item.caption || ''}
                placeholder="Mô tả / caption"
                rows={2}
                className="text-sm"
                onBlur={(e) => {
                  if (e.target.value !== (item.caption || '')) {
                    handleUpdate(item.id, { caption: e.target.value });
                  }
                }}
              />
              {activeType === 'menu_photo' && (
                <Select
                  defaultValue={item.media_group || 'general'}
                  onValueChange={(v) => handleUpdate(item.id, { media_group: v })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MENU_GROUPS.map(g => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  defaultValue={item.sort_order}
                  className="w-20 text-sm"
                  placeholder="Thứ tự"
                  onBlur={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && v !== item.sort_order) {
                      handleUpdate(item.id, { sort_order: v });
                    }
                  }}
                />
                <span className="text-xs text-muted-foreground">Thứ tự sắp xếp</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Chưa có nội dung. Hãy tải lên {activeType.includes('video') ? 'video' : 'ảnh'} đầu tiên!</p>
        </div>
      )}
    </div>
  );
};

export default AdminCuisineMedia;
