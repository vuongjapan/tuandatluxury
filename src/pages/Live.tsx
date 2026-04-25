import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Radio, Eye, ShoppingBag, Play, Send } from 'lucide-react';

const fmtVND = (v: number) => (v || 0).toLocaleString('vi-VN') + '₫';
const REACTIONS = ['❤️', '👍', '🔥', '😍', '👏'];

const buildEmbed = (mode: string, url: string) => {
  if (!url) return '';
  if (mode === 'youtube') {
    const m = url.match(/(?:youtu\.be\/|v=|live\/)([\w-]{6,})/);
    return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1` : url;
  }
  if (mode === 'facebook') {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&autoplay=1&show_text=false`;
  }
  if (mode === 'tiktok') {
    const m = url.match(/video\/(\d+)/);
    return m ? `https://www.tiktok.com/embed/v2/${m[1]}` : url;
  }
  return url;
};

const FloatingReaction = ({ icon, onDone }: { icon: string; onDone: () => void }) => {
  const left = useRef(20 + Math.random() * 60).current;
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="absolute bottom-20 text-3xl pointer-events-none animate-[float-up_3s_ease-out_forwards]"
      style={{ left: `${left}%` }}
    >
      {icon}
    </div>
  );
};

const Live = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [activeRecording, setActiveRecording] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [reactions, setReactions] = useState<{ id: string; icon: string }[]>([]);
  const [draft, setDraft] = useState('');
  const [userName, setUserName] = useState(() => localStorage.getItem('live_user_name') || '');
  const [askName, setAskName] = useState(false);
  const [viewers, setViewers] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    const [{ data: s }, { data: r }] = await Promise.all([
      supabase.from('live_sessions').select('*').eq('is_active', true).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('live_recordings').select('*').eq('is_visible', true).order('created_at', { ascending: false }).limit(20),
    ]);
    setSession(s || null);
    setRecordings(r || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!session) { setComments([]); return; }
    supabase.from('live_comments').select('*').eq('session_id', session.id)
      .order('created_at', { ascending: true }).limit(100)
      .then(({ data }) => setComments(data || []));
  }, [session?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const ch = supabase.channel('live-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_recordings' }, fetchData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_comments' }, (p) => {
        const c: any = p.new;
        if (session && c.session_id !== session.id) return;
        setComments(prev => [...prev.slice(-99), c]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_reactions' }, (p) => {
        if (session && p.new.session_id !== session.id) return;
        setReactions(prev => [...prev.slice(-15), { id: p.new.id, icon: p.new.icon }]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchData, session?.id]);

  useEffect(() => {
    if (!session) return;
    const ch = supabase.channel(`viewers-${session.id}`, {
      config: { presence: { key: crypto.randomUUID() } },
    });
    ch.on('presence', { event: 'sync' }, () => {
      setViewers(Object.keys(ch.presenceState()).length);
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await ch.track({ at: Date.now() });
    });
    return () => { supabase.removeChannel(ch); };
  }, [session?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments]);

  useEffect(() => {
    const id = 'live-keyframes';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = '@keyframes float-up { 0%{transform:translateY(0) scale(1);opacity:1} 100%{transform:translateY(-400px) scale(1.5);opacity:0} }';
    document.head.appendChild(el);
  }, []);

  const sendComment = async () => {
    if (!draft.trim() || !session) return;
    if (!userName.trim()) { setAskName(true); return; }
    await supabase.from('live_comments').insert({ session_id: session.id, user_name: userName, content: draft.trim() });
    setDraft('');
  };

  const sendReaction = async (icon: string) => {
    if (!session) return;
    await supabase.from('live_reactions').insert({ session_id: session.id, icon });
  };

  const removeReaction = (id: string) => setReactions(prev => prev.filter(r => r.id !== id));

  const confirmName = () => {
    if (!userName.trim()) return;
    localStorage.setItem('live_user_name', userName);
    setAskName(false);
    if (draft.trim()) sendComment();
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const renderPlayer = () => {
    if (activeRecording) {
      return <video src={activeRecording.video_url} controls autoPlay className="w-full h-full object-contain bg-black" />;
    }
    if (!session) return null;
    if (session.mode === 'mock' && session.recording_url) {
      return <video src={session.recording_url} autoPlay loop playsInline controls className="w-full h-full object-cover bg-black" />;
    }
    if (session.embed_url) {
      return (
        <iframe
          src={buildEmbed(session.mode, session.embed_url)}
          className="w-full h-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title="Live"
        />
      );
    }
    return <div className="w-full h-full flex items-center justify-center text-white/60">Chưa có video</div>;
  };

  if (activeRecording) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <Button variant="ghost" size="sm" onClick={() => setActiveRecording(null)} className="mb-3">
            <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
          </Button>
          <div className="aspect-video bg-black rounded-xl overflow-hidden max-w-5xl mx-auto">{renderPlayer()}</div>
          <h1 className="font-display text-xl md:text-2xl font-bold mt-4 max-w-5xl mx-auto">{activeRecording.title}</h1>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
        ) : session ? (
          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4 max-w-7xl mx-auto">
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-[9/16] sm:aspect-video lg:aspect-[9/16] max-h-[80vh]">
              {renderPlayer()}
              <div className="absolute top-0 inset-x-0 p-3 flex items-start justify-between bg-gradient-to-b from-black/70 to-transparent">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="animate-pulse">
                    <Radio className="h-3 w-3 mr-1" />LIVE
                  </Badge>
                  <Badge variant="secondary" className="bg-black/50 text-white border-0">
                    <Eye className="h-3 w-3 mr-1" />{viewers}
                  </Badge>
                </div>
              </div>
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-semibold text-sm md:text-base line-clamp-2">{session.title_vi}</p>
              </div>
              {reactions.map(r => <FloatingReaction key={r.id} icon={r.icon} onDone={() => removeReaction(r.id)} />)}
              <div className="absolute right-3 bottom-24 flex flex-col gap-2">
                {REACTIONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => sendReaction(icon)}
                    className="h-11 w-11 rounded-full bg-white/15 backdrop-blur-md hover:bg-white/30 active:scale-90 transition-all text-2xl flex items-center justify-center"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {(session.product_title || session.product_image || session.product_price > 0) && (
                <div className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-destructive mb-2">
                    <ShoppingBag className="h-4 w-4" />Đang bán
                  </div>
                  <div className="flex gap-3">
                    {session.product_image && (
                      <img src={session.product_image} alt={session.product_title || ''} className="w-24 h-24 object-cover rounded-lg shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display font-bold line-clamp-2">{session.product_title || 'Sản phẩm đặc biệt'}</h2>
                      {session.product_price > 0 && <p className="text-lg font-bold text-primary mt-1">{fmtVND(session.product_price)}</p>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-3 bg-gradient-to-r from-primary to-primary/80"
                    onClick={() => navigate(session.cta_link || '/booking')}
                  >
                    {session.cta_label || 'Đặt ngay'}
                  </Button>
                </div>
              )}

              <div className="bg-card rounded-2xl border border-border flex flex-col flex-1 min-h-[300px] max-h-[500px]">
                <div className="px-4 py-2 border-b border-border text-xs font-semibold text-muted-foreground">
                  💬 Bình luận trực tiếp
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {comments.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Hãy là người đầu tiên bình luận!</p>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="text-sm">
                        <span className="font-semibold text-primary">{c.user_name}: </span>
                        <span className="text-foreground/90">{c.content}</span>
                      </div>
                    ))
                  )}
                  <div ref={endRef} />
                </div>
                {askName ? (
                  <div className="p-2 border-t border-border space-y-2">
                    <Input
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      placeholder="Nhập tên của bạn"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && confirmName()}
                    />
                    <Button size="sm" className="w-full" onClick={confirmName}>Bắt đầu chat</Button>
                  </div>
                ) : (
                  <div className="p-2 border-t border-border flex gap-2">
                    <Input
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendComment()}
                      placeholder={userName ? `Nhắn với tư cách ${userName}...` : 'Nhập bình luận...'}
                      className="text-sm"
                    />
                    <Button size="icon" onClick={sendComment} disabled={!draft.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted text-muted-foreground text-sm mb-3">
                <Radio className="h-4 w-4" /> Hiện chưa có livestream
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold">Kho video Tuấn Đạt Luxury</h1>
              <p className="text-sm text-muted-foreground mt-2">Xem lại các livestream đã phát</p>
            </div>
            {recordings.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <Radio className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Chưa có video nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recordings.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setActiveRecording(r)}
                    className="group text-left bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/40 transition-all"
                  >
                    <div className="relative aspect-video bg-black">
                      {r.thumbnail_url ? (
                        <img src={r.thumbnail_url} alt={r.title} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <video src={r.video_url} className="w-full h-full object-cover" preload="metadata" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-12 w-12 text-white" fill="currentColor" />
                      </div>
                      {r.duration_sec > 0 && (
                        <span className="absolute bottom-1 right-1 text-[11px] px-1.5 py-0.5 rounded bg-black/70 text-white">
                          {fmtTime(r.duration_sec)}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm line-clamp-2">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(r.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Live;
