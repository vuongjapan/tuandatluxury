import { useState, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/compressImage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, Trash2, Plus, Eye, EyeOff, Film, Image, X } from 'lucide-react';

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

const MEDIA_TYPES: { value: MediaType; label: string; icon: string }[] = [
  { value: 'hero_video', label: 'Video Hero', icon: '🎬' },
  { value: 'short_video', label: 'Video ngắn', icon: '📱' },
  { value: 'image', label: 'Hình ảnh', icon: '🖼️' },
  { value: 'moment', label: 'Moment khách', icon: '📸' },
  { value: 'menu_photo', label: 'Ảnh menu', icon: '📋' },
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadCurrent, setUploadCurrent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

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

  const processUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    setUploadTotal(files.length);
    setUploadCurrent(0);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadCurrent(i + 1);
        setUploadProgress(Math.round(((i) / files.length) * 100));

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
          sort_order: filtered.length + i,
        } as any);

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }
      toast({ title: `Đã tải lên ${files.length} file ✓` });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['cuisine-media'] });
    } catch (err: any) {
      toast({ title: 'Lỗi tải lên', description: err.message, variant: 'destructive' });
    }
    setUploading(false);
    setUploadProgress(0);
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList) return;
    await processUpload(Array.from(fileList));
  };

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const accept = activeType.includes('video') ? 'video/' : 'image/';
    const validFiles = files.filter(f => f.type.startsWith(accept));
    if (validFiles.length > 0) {
      await processUpload(validFiles);
    } else {
      toast({ title: 'File không hợp lệ', description: `Vui lòng chọn file ${activeType.includes('video') ? 'video' : 'ảnh'}`, variant: 'destructive' });
    }
  }, [activeType, filtered.length]);

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

  const isVideoType = activeType.includes('video');

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
            {mt.icon} {mt.label}
            <span className="ml-1 text-xs opacity-70">
              ({mediaItems.filter(m => m.type === mt.value).length})
            </span>
          </button>
        ))}
      </div>

      {/* Upload area with drag & drop */}
      <div
        ref={dropRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border bg-card hover:border-primary/40'
        }`}
      >
        <input
          type="file"
          id="cuisine-upload"
          multiple
          accept={isVideoType ? 'video/*' : 'image/*'}
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />

        {uploading ? (
          <div className="space-y-3 max-w-sm mx-auto">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium">
              Đang tải {uploadCurrent}/{uploadTotal}...
            </p>
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
          </div>
        ) : (
          <label htmlFor="cuisine-upload" className="cursor-pointer flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              {isVideoType ? <Film className="h-7 w-7 text-primary" /> : <Image className="h-7 w-7 text-primary" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {isDragging ? 'Thả file vào đây!' : 'Kéo thả hoặc click để tải lên'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isVideoType
                  ? 'Video MP4, MOV... tối đa 50MB/file'
                  : 'Ảnh JPG, PNG, WEBP... tối đa 50MB/file (tự động nén)'}
              </p>
            </div>
          </label>
        )}
      </div>

      {/* URL input for video links */}
      {isVideoType && (
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm font-medium mb-2">Hoặc nhập link video (YouTube, MP4...):</p>
          <div className="flex gap-2">
            <Input
              id="video-url-input"
              placeholder="https://youtube.com/watch?v=... hoặc link MP4"
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
          <div key={item.id} className="bg-card rounded-xl border border-border overflow-hidden group relative">
            {/* Preview */}
            <div className="aspect-video bg-muted relative overflow-hidden">
              {item.type.includes('video') ? (
                item.media_url.includes('youtube') || item.media_url.includes('youtu.be') ? (
                  <iframe
                    src={item.media_url.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allow="autoplay"
                    loading="lazy"
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

              {/* Status badge */}
              <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                item.is_active ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
              }`}>
                {item.is_active ? 'Hiện' : 'Ẩn'}
              </div>

              {/* Action buttons */}
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={() => handleToggle(item.id, item.is_active)}
                  className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  title={item.is_active ? 'Ẩn đi' : 'Hiện lại'}
                >
                  {item.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-full bg-destructive/80 text-white hover:bg-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
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
                <span className="text-xs text-muted-foreground">Thứ tự</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            {isVideoType ? <Film className="h-8 w-8" /> : <Image className="h-8 w-8" />}
          </div>
          <p>Chưa có nội dung. Hãy tải lên {isVideoType ? 'video' : 'ảnh'} đầu tiên!</p>
        </div>
      )}
    </div>
  );
};

export default AdminCuisineMedia;
