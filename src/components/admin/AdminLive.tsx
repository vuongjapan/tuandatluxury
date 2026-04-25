import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Radio, Save, Eye, ExternalLink, Trash2 } from 'lucide-react';

interface LiveSession {
  id: string;
  title_vi: string;
  is_active: boolean;
  mode: string;
  embed_url: string | null;
  recording_url: string | null;
  product_title: string | null;
  product_image: string | null;
  product_price: number;
  cta_label: string;
  cta_link: string | null;
}

const AdminLive = () => {
  const { toast } = useToast();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newRecTitle, setNewRecTitle] = useState('');
  const [newRecUrl, setNewRecUrl] = useState('');
  const [newRecThumb, setNewRecThumb] = useState('');

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: r }] = await Promise.all([
      supabase.from('live_sessions').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('live_recordings').select('*').order('created_at', { ascending: false }),
    ]);
    if (s) {
      setSession(s as any);
    } else {
      // Create default session
      const { data: created } = await supabase.from('live_sessions').insert({
        title_vi: 'Livestream Tuấn Đạt Luxury',
        is_active: false,
        mode: 'facebook',
      }).select().single();
      setSession(created as any);
    }
    setRecordings(r || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (k: keyof LiveSession, v: any) => {
    if (!session) return;
    setSession({ ...session, [k]: v });
  };

  const save = async () => {
    if (!session) return;
    setSaving(true);
    const { error } = await supabase.from('live_sessions').update({
      title_vi: session.title_vi,
      is_active: session.is_active,
      mode: session.mode,
      embed_url: session.embed_url,
      recording_url: session.recording_url,
      product_title: session.product_title,
      product_image: session.product_image,
      product_price: session.product_price || 0,
      cta_label: session.cta_label || 'Đặt ngay',
      cta_link: session.cta_link,
      started_at: session.is_active ? new Date().toISOString() : null,
    }).eq('id', session.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Lỗi lưu', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ Đã lưu' });
    }
  };

  const addRecording = async () => {
    if (!newRecTitle.trim() || !newRecUrl.trim()) {
      toast({ title: 'Cần tiêu đề và URL video', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('live_recordings').insert({
      title: newRecTitle.trim(),
      video_url: newRecUrl.trim(),
      thumbnail_url: newRecThumb.trim() || null,
      is_visible: true,
    });
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } else {
      setNewRecTitle(''); setNewRecUrl(''); setNewRecThumb('');
      load();
      toast({ title: '✅ Đã thêm video' });
    }
  };

  const toggleVisible = async (id: string, v: boolean) => {
    await supabase.from('live_recordings').update({ is_visible: v }).eq('id', id);
    load();
  };

  const deleteRec = async (id: string) => {
    if (!confirm('Xóa video này?')) return;
    await supabase.from('live_recordings').delete().eq('id', id);
    load();
  };

  if (loading || !session) {
    return <div className="text-center py-12 text-muted-foreground">Đang tải...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Live session */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Radio className={`h-5 w-5 ${session.is_active ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />
            Phiên Live hiện tại
          </h2>
          <a href="/live" target="_blank" rel="noopener" className="text-xs text-primary hover:underline flex items-center gap-1">
            <Eye className="h-3 w-3" /> Xem trang Live
          </a>
        </div>

        <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
          <Switch
            checked={session.is_active}
            onCheckedChange={v => update('is_active', v)}
          />
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {session.is_active ? '🔴 Đang phát LIVE' : '⚫ Ngưng phát'}
            </p>
            <p className="text-xs text-muted-foreground">Bật để hiển thị huy hiệu LIVE và video trên trang /live</p>
          </div>
        </div>

        <div>
          <Label>Tiêu đề livestream</Label>
          <Input value={session.title_vi} onChange={e => update('title_vi', e.target.value)} placeholder="Ví dụ: Tour phòng VIP có view biển" />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Nguồn phát</Label>
            <Select value={session.mode} onValueChange={v => update('mode', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="facebook">Facebook Live</SelectItem>
                <SelectItem value="youtube">YouTube Live</SelectItem>
                <SelectItem value="tiktok">TikTok Live</SelectItem>
                <SelectItem value="mock">Video mp4 (test)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>
              {session.mode === 'mock' ? 'URL video MP4' : `Link ${session.mode === 'facebook' ? 'Facebook' : session.mode === 'youtube' ? 'YouTube' : 'TikTok'} Live`}
            </Label>
            <Input
              value={(session.mode === 'mock' ? session.recording_url : session.embed_url) || ''}
              onChange={e => update(session.mode === 'mock' ? 'recording_url' : 'embed_url', e.target.value)}
              placeholder={
                session.mode === 'facebook' ? 'https://www.facebook.com/.../videos/123...' :
                session.mode === 'youtube' ? 'https://youtube.com/live/abc123' :
                session.mode === 'tiktok' ? 'https://www.tiktok.com/@user/video/123...' :
                'https://...mp4'
              }
            />
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 rounded-lg text-xs">
          <p className="font-semibold mb-1">📌 Hướng dẫn dán link Facebook Live:</p>
          <p className="text-muted-foreground">1. Vào fanpage / video Live trên Facebook → Bấm chia sẻ → Sao chép liên kết</p>
          <p className="text-muted-foreground">2. Dán nguyên link vào ô bên trên (ví dụ: <code>https://www.facebook.com/tuandatluxury/videos/123456</code>)</p>
          <p className="text-muted-foreground">3. Bật công tắc "Đang phát LIVE" và bấm Lưu</p>
        </div>

        <div className="border-t border-border pt-4">
          <p className="font-semibold text-sm mb-3">🛒 Sản phẩm đang bán (hiển thị bên cạnh video)</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Tên sản phẩm</Label>
              <Input value={session.product_title || ''} onChange={e => update('product_title', e.target.value)} placeholder="Ví dụ: Phòng VIP đêm Live giảm 30%" />
            </div>
            <div>
              <Label>Giá (VNĐ)</Label>
              <Input type="number" value={session.product_price || 0} onChange={e => update('product_price', parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <Label>URL ảnh sản phẩm</Label>
              <Input value={session.product_image || ''} onChange={e => update('product_image', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>Link đặt</Label>
              <Input value={session.cta_link || ''} onChange={e => update('cta_link', e.target.value)} placeholder="/booking" />
            </div>
            <div>
              <Label>Nhãn nút</Label>
              <Input value={session.cta_label || ''} onChange={e => update('cta_label', e.target.value)} placeholder="Đặt ngay" />
            </div>
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>

      {/* Recordings */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h2 className="font-display text-lg font-bold">📹 Kho video Live đã phát</h2>

        <div className="grid sm:grid-cols-3 gap-2">
          <Input value={newRecTitle} onChange={e => setNewRecTitle(e.target.value)} placeholder="Tiêu đề video" />
          <Input value={newRecUrl} onChange={e => setNewRecUrl(e.target.value)} placeholder="URL video MP4 / YouTube" />
          <Input value={newRecThumb} onChange={e => setNewRecThumb(e.target.value)} placeholder="Ảnh thumbnail (tùy chọn)" />
        </div>
        <Button size="sm" onClick={addRecording}>+ Thêm video</Button>

        <div className="space-y-2">
          {recordings.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
              {r.thumbnail_url && <img src={r.thumbnail_url} alt="" className="w-16 h-12 object-cover rounded" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{r.title}</p>
                <a href={r.video_url} target="_blank" rel="noopener" className="text-xs text-muted-foreground truncate hover:text-primary flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />{r.video_url}
                </a>
              </div>
              <Switch checked={r.is_visible} onCheckedChange={v => toggleVisible(r.id, v)} />
              <Button variant="ghost" size="icon" onClick={() => deleteRec(r.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {recordings.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Chưa có video nào</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminLive;
