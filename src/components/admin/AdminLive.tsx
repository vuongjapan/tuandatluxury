import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Radio, Save } from 'lucide-react';
import { toast } from 'sonner';

interface LiveSession {
  id?: string;
  title_vi: string;
  mode: string;
  embed_url: string | null;
  product_type: string | null;
  product_ref_id: string | null;
  product_title: string | null;
  product_image: string | null;
  product_price: number;
  cta_label: string;
  cta_link: string | null;
  is_active: boolean;
}

const defaults: LiveSession = {
  title_vi: 'Livestream Tuấn Đạt Luxury',
  mode: 'youtube',
  embed_url: '',
  product_type: 'room',
  product_ref_id: '',
  product_title: '',
  product_image: '',
  product_price: 0,
  cta_label: 'Đặt ngay',
  cta_link: '/booking',
  is_active: false,
};

const AdminLive = () => {
  const [session, setSession] = useState<LiveSession>(defaults);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    const { data } = await supabase.from('live_sessions').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle();
    if (data) setSession(data as LiveSession);
    setLoading(false);
  };

  useEffect(() => { fetchSession(); }, []);

  const save = async () => {
    const payload = { ...session };
    const { error } = session.id
      ? await supabase.from('live_sessions').update(payload).eq('id', session.id)
      : await supabase.from('live_sessions').insert(payload as any).select().single();
    if (error) return toast.error(error.message);
    toast.success('Đã lưu cấu hình live');
    fetchSession();
  };

  const uploadImage = async (file: File) => {
    const path = `live/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('site-assets').upload(path, file);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
    setSession({ ...session, product_image: data.publicUrl });
  };

  if (loading) return <p className="text-muted-foreground">Đang tải...</p>;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={`h-5 w-5 ${session.is_active ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />
            <span className="font-semibold">Trạng thái livestream</span>
            {session.is_active ? <Badge variant="destructive">ĐANG LIVE</Badge> : <Badge variant="secondary">Tắt</Badge>}
          </div>
          <Switch checked={session.is_active} onCheckedChange={(v) => setSession({ ...session, is_active: v })} />
        </div>

        <div>
          <label className="text-sm font-medium">Tiêu đề live</label>
          <Input value={session.title_vi} onChange={(e) => setSession({ ...session, title_vi: e.target.value })} />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Chế độ livestream</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { v: 'webrtc', label: '📹 Live trực tiếp (WebRTC)' },
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

        {session.mode !== 'webrtc' && (
          <div>
            <label className="text-sm font-medium">URL livestream</label>
            <Input
              value={session.embed_url || ''}
              onChange={(e) => setSession({ ...session, embed_url: e.target.value })}
              placeholder={
                session.mode === 'youtube' ? 'https://www.youtube.com/watch?v=... hoặc youtu.be/...' :
                session.mode === 'facebook' ? 'https://www.facebook.com/... (URL video)' :
                'https://www.tiktok.com/@user/video/...'
              }
            />
            <p className="text-xs text-muted-foreground mt-1">Dán URL gốc, hệ thống tự chuyển sang định dạng nhúng.</p>
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <h3 className="font-semibold">Sản phẩm đang bán trong live</h3>
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
            <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
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
            <Input type="number" value={session.product_price} onChange={(e) => setSession({ ...session, product_price: +e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Nhãn nút CTA</label>
            <Input value={session.cta_label} onChange={(e) => setSession({ ...session, cta_label: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Link CTA (đặt phòng / đấu giá)</label>
          <Input value={session.cta_link || ''} onChange={(e) => setSession({ ...session, cta_link: e.target.value })} placeholder="/booking hoặc /auction" />
        </div>
      </div>

      <Button onClick={save} size="lg" className="w-full md:w-auto">
        <Save className="h-4 w-4 mr-2" /> Lưu cấu hình
      </Button>
    </div>
  );
};

export default AdminLive;
