import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Radio, Save, Upload, Trash2, Eye, EyeOff, Film, Play } from 'lucide-react';
import { toast } from 'sonner';

interface LiveSession {
  id?: string;
  title_vi: string;
  mode: string;
  embed_url: string | null;
  recording_url: string | null;
  product_type: string | null;
  product_title: string | null;
  product_image: string | null;
  product_price: number;
  cta_label: string;
  cta_link: string | null;
  is_active: boolean;
}

interface Recording {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  duration_sec: number;
  is_visible: boolean;
  created_at: string;
}

const defaults: LiveSession = {
  title_vi: 'Livestream Tuấn Đạt Luxury',
  mode: 'mock',
  embed_url: '',
  recording_url: '',
  product_type: 'room',
  product_title: '',
  product_image: '',
  product_price: 0,
  cta_label: 'Đặt ngay',
  cta_link: '/booking',
  is_active: false,
};

const AdminLive = () => {
  const [session, setSession] = useState<LiveSession>(defaults);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchData = async () => {
    const [{ data: sess }, { data: recs }] = await Promise.all([
      supabase.from('live_sessions').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('live_recordings').select('*').order('created_at', { ascending: false }),
    ]);
    if (sess) setSession(sess as LiveSession);
    setRecordings((recs as Recording[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const save = async () => {
    const { id, ...payload } = session;
    const { error } = id
      ? await supabase.from('live_sessions').update(payload).eq('id', id)
      : await supabase.from('live_sessions').insert(payload as any).select().single();
    if (error) return toast.error(error.message);
    toast.success('Đã lưu cấu hình live');
    fetchData();
  };

  const uploadProductImage = async (file: File) => {
    const path = `products/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('site-assets').upload(path, file);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
    setSession({ ...session, product_image: data.publicUrl });
  };

  // Upload video → save to recordings + auto set as current live
  const uploadVideo = async (file: File, asLive: boolean) => {
    if (!file.type.startsWith('video/')) return toast.error('Vui lòng chọn file video MP4');
    if (file.size > 200 * 1024 * 1024) return toast.error('Video tối đa 200MB');
    setUploading(true);
    setUploadProgress(10);
    try {
      const path = `videos/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error: upErr } = await supabase.storage.from('live-videos').upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      setUploadProgress(60);
      const { data: pub } = supabase.storage.from('live-videos').getPublicUrl(path);

      // Get duration via temp video element
      const duration = await new Promise<number>((resolve) => {
        const v = document.createElement('video');
        v.preload = 'metadata';
        v.onloadedmetadata = () => resolve(Math.round(v.duration) || 0);
        v.onerror = () => resolve(0);
        v.src = pub.publicUrl;
      });
      setUploadProgress(80);

      const title = file.name.replace(/\.[^.]+$/, '').slice(0, 80);
      const { data: rec, error: recErr } = await supabase.from('live_recordings')
        .insert({ title, video_url: pub.publicUrl, duration_sec: duration }).select().single();
      if (recErr) throw recErr;

      if (asLive) {
        await supabase.from('live_sessions').update({
          mode: 'mock',
          recording_url: pub.publicUrl,
          is_active: true,
          started_at: new Date().toISOString(),
        }).eq('id', session.id || '00000000-0000-0000-0000-000000000000');
        // If no session yet, insert one
        if (!session.id) {
          await supabase.from('live_sessions').insert({
            ...session, mode: 'mock', recording_url: pub.publicUrl, is_active: true,
            started_at: new Date().toISOString(),
          } as any);
        }
      }
      setUploadProgress(100);
      toast.success(asLive ? 'Đã upload và bắt đầu live!' : 'Đã upload vào kho video');
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Lỗi upload');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const stopLive = async () => {
    if (!session.id) return;
    await supabase.from('live_sessions').update({
      is_active: false,
      ended_at: new Date().toISOString(),
    }).eq('id', session.id);
    toast.success('Đã dừng live');
    fetchData();
  };

  const toggleVisibility = async (rec: Recording) => {
    await supabase.from('live_recordings').update({ is_visible: !rec.is_visible }).eq('id', rec.id);
    fetchData();
  };

  const deleteRecording = async (rec: Recording) => {
    if (!confirm(`Xóa video "${rec.title}"?`)) return;
    // Try delete file too
    try {
      const url = new URL(rec.video_url);
      const path = url.pathname.split('/live-videos/')[1];
      if (path) await supabase.storage.from('live-videos').remove([path]);
    } catch {}
    await supabase.from('live_recordings').delete().eq('id', rec.id);
    toast.success('Đã xóa video');
    fetchData();
  };

  const useAsLive = async (rec: Recording) => {
    if (!session.id) {
      await supabase.from('live_sessions').insert({
        ...session, mode: 'mock', recording_url: rec.video_url, is_active: true,
        started_at: new Date().toISOString(),
      } as any);
    } else {
      await supabase.from('live_sessions').update({
        mode: 'mock', recording_url: rec.video_url, is_active: true,
        started_at: new Date().toISOString(),
      }).eq('id', session.id);
    }
    toast.success('Đang phát video này như livestream');
    fetchData();
  };

  if (loading) return <p className="text-muted-foreground">Đang tải...</p>;

  return (
    <div className="space-y-4 max-w-4xl">
      {/* === Status === */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Radio className={`h-5 w-5 ${session.is_active ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />
            <span className="font-semibold">Trạng thái</span>
            {session.is_active ? <Badge variant="destructive">ĐANG LIVE</Badge> : <Badge variant="secondary">Tắt</Badge>}
          </div>
          <div className="flex items-center gap-2">
            {session.is_active && (
              <Button size="sm" variant="destructive" onClick={stopLive}>Dừng live</Button>
            )}
            <Switch checked={session.is_active} onCheckedChange={(v) => setSession({ ...session, is_active: v })} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Tiêu đề live</label>
          <Input value={session.title_vi} onChange={(e) => setSession({ ...session, title_vi: e.target.value })} />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Chế độ</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { v: 'mock', label: '🎬 Video MP4 (Mock Live)' },
              { v: 'youtube', label: '▶️ YouTube' },
              { v: 'facebook', label: '📘 Facebook' },
              { v: 'tiktok', label: '🎵 TikTok' },
            ].map(opt => (
              <Button key={opt.v} type="button" size="sm"
                variant={session.mode === opt.v ? 'default' : 'outline'}
                onClick={() => setSession({ ...session, mode: opt.v })}>
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {session.mode === 'mock' ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload video MP4 (max 200MB) — phát như đang live, có comment + tim realtime</label>
            <div className="flex gap-2 flex-wrap">
              <label className="cursor-pointer">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${uploading ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:opacity-90'}`}>
                  <Upload className="h-4 w-4" />
                  {uploading ? `Đang tải ${uploadProgress}%...` : 'Upload và bắt đầu LIVE'}
                </div>
                <input type="file" accept="video/*" className="hidden" disabled={uploading}
                  onChange={(e) => e.target.files?.[0] && uploadVideo(e.target.files[0], true)} />
              </label>
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-border hover:bg-secondary">
                  <Upload className="h-4 w-4" />Chỉ lưu vào kho
                </div>
                <input type="file" accept="video/*" className="hidden" disabled={uploading}
                  onChange={(e) => e.target.files?.[0] && uploadVideo(e.target.files[0], false)} />
              </label>
            </div>
            {session.recording_url && (
              <div className="text-xs text-muted-foreground">URL hiện tại: <a href={session.recording_url} target="_blank" rel="noreferrer" className="text-primary underline">{session.recording_url.slice(-40)}</a></div>
            )}
          </div>
        ) : (
          <div>
            <label className="text-sm font-medium">URL livestream</label>
            <Input
              value={session.embed_url || ''}
              onChange={(e) => setSession({ ...session, embed_url: e.target.value })}
              placeholder={session.mode === 'youtube' ? 'https://www.youtube.com/watch?v=...'
                : session.mode === 'facebook' ? 'https://www.facebook.com/.../videos/...'
                : 'https://www.tiktok.com/@user/video/...'}
            />
          </div>
        )}
      </div>

      {/* === Product === */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <h3 className="font-semibold">Sản phẩm bán trong live</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Loại</label>
            <select className="w-full h-10 px-3 rounded-md border border-input bg-background"
              value={session.product_type || 'room'}
              onChange={(e) => setSession({ ...session, product_type: e.target.value })}>
              <option value="room">Phòng</option>
              <option value="combo">Combo</option>
              <option value="auction">Đấu giá</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Ảnh sản phẩm</label>
            <Input type="file" accept="image/*"
              onChange={(e) => e.target.files?.[0] && uploadProductImage(e.target.files[0])} />
          </div>
        </div>
        {session.product_image && <img src={session.product_image} alt="" className="w-32 h-32 rounded-lg object-cover" />}
        <div>
          <label className="text-sm font-medium">Tên sản phẩm</label>
          <Input value={session.product_title || ''} onChange={(e) => setSession({ ...session, product_title: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Giá (VNĐ)</label>
            <Input type="number" value={session.product_price}
              onChange={(e) => setSession({ ...session, product_price: +e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Nhãn nút CTA</label>
            <Input value={session.cta_label} onChange={(e) => setSession({ ...session, cta_label: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Link CTA</label>
          <Input value={session.cta_link || ''}
            onChange={(e) => setSession({ ...session, cta_link: e.target.value })}
            placeholder="/booking hoặc /auction" />
        </div>
      </div>

      <Button onClick={save} size="lg"><Save className="h-4 w-4 mr-2" /> Lưu cấu hình</Button>

      {/* === Recordings library === */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <Film className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Kho video ({recordings.length})</h3>
        </div>
        {recordings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có video nào</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recordings.map(rec => (
              <div key={rec.id} className={`flex gap-3 p-3 rounded-lg border ${rec.is_visible ? 'border-border' : 'border-dashed opacity-60'}`}>
                <video src={rec.video_url} className="w-24 h-16 object-cover rounded bg-black shrink-0" preload="metadata" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{rec.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(rec.created_at).toLocaleString('vi-VN')}</p>
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => useAsLive(rec)} title="Phát lại như đang live">
                      <Play className="h-3 w-3" /> Live lại
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toggleVisibility(rec)} title={rec.is_visible ? 'Ẩn' : 'Hiện'}>
                      {rec.is_visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteRecording(rec)} title="Xóa">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLive;
