import { useEffect, useState, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radio, ShoppingBag, Video } from 'lucide-react';

interface LiveSession {
  id: string;
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

const fmt = (n: number) => (n || 0).toLocaleString('vi-VN') + '₫';

// Convert various URLs to embeddable iframe src
const toEmbedSrc = (mode: string, url: string): string => {
  if (!url) return '';
  if (mode === 'youtube') {
    // youtu.be/xxx or youtube.com/watch?v=xxx
    const m = url.match(/(?:youtu\.be\/|v=|live\/)([\w-]{6,})/);
    if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1`;
    return url;
  }
  if (mode === 'facebook') {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&autoplay=1`;
  }
  if (mode === 'tiktok') {
    // TikTok embed: best to use blockquote, but iframe via tiktok.com/embed/v2/<id>
    const m = url.match(/video\/(\d+)/);
    if (m) return `https://www.tiktok.com/embed/v2/${m[1]}`;
    return url;
  }
  return url;
};

const WebRTCStream = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStreaming(true);
    } catch (e: any) { setErr(e?.message || 'Không truy cập được camera'); }
  };

  const stop = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      {!streaming && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
          <Video className="h-10 w-10 opacity-60" />
          <Button onClick={start} size="sm">Bật camera</Button>
          {err && <p className="text-xs text-destructive">{err}</p>}
        </div>
      )}
      {streaming && (
        <Button onClick={stop} variant="destructive" size="sm" className="absolute top-3 right-3">Tắt</Button>
      )}
    </div>
  );
};

const LivePage = () => {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLive = async () => {
    const { data } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setSession((data as LiveSession) || null);
    setLoading(false);
  };

  useEffect(() => {
    fetchLive();
    const ch = supabase
      .channel('live-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, fetchLive)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-destructive text-white font-semibold text-sm mb-3 animate-pulse">
            <Radio className="h-4 w-4" /> LIVE NOW
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Livestream Tuấn Đạt Luxury</h1>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
        ) : !session ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border max-w-2xl mx-auto">
            <Radio className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-semibold text-lg mb-1">Hiện chưa có livestream</p>
            <p className="text-sm text-muted-foreground">Vui lòng quay lại sau!</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6">
            {/* Video */}
            <div>
              {session.mode === 'webrtc' ? (
                <WebRTCStream />
              ) : (
                <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
                  {session.embed_url ? (
                    <iframe
                      src={toEmbedSrc(session.mode, session.embed_url)}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                      title="Live"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/60">Chưa có URL livestream</div>
                  )}
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="destructive" className="animate-pulse"><Radio className="h-3 w-3 mr-1" />Trực tiếp</Badge>
                <span className="text-sm text-muted-foreground">{session.title_vi}</span>
              </div>
            </div>

            {/* Product card */}
            <aside className="bg-card rounded-2xl border border-border p-5 h-fit lg:sticky lg:top-32">
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive mb-3">
                <ShoppingBag className="h-4 w-4" /> Đang bán
              </div>
              {session.product_image && (
                <img src={session.product_image} alt={session.product_title || ''} className="w-full aspect-video object-cover rounded-lg mb-3" />
              )}
              <h2 className="font-display text-xl font-bold mb-1">{session.product_title || 'Sản phẩm đặc biệt'}</h2>
              {session.product_price > 0 && (
                <p className="text-2xl font-bold text-primary mb-4">{fmt(session.product_price)}</p>
              )}
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-primary/80"
                onClick={() => {
                  if (session.cta_link) window.location.href = session.cta_link;
                  else window.location.href = '/booking';
                }}
              >
                {session.cta_label || 'Đặt ngay'}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">Ưu đãi chỉ trong khi live!</p>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default LivePage;
