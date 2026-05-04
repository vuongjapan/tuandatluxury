import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare, Mic, Mail, FileText, Phone, User, Smartphone, Monitor,
  RefreshCw, Send, TrendingUp, Clock, CheckCircle2, XCircle, Search,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

type Session = {
  id: string;
  session_key: string;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  device_type: string | null;
  entry_page: string | null;
  message_count: number;
  voice_messages_count: number;
  used_voice: boolean;
  outcome: string;
  booking_code: string | null;
  email_sent_to: string | null;
  started_at: string;
  last_activity: string;
  extracted_info: any;
  admin_note: string | null;
  admin_tag: string | null;
};

type ChatMsg = {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  is_voice_input?: boolean;
  is_voice_output?: boolean;
  is_admin_message?: boolean;
  created_at: string;
};

const outcomeMeta: Record<string, { label: string; color: string }> = {
  no_action: { label: 'Chưa hành động', color: 'bg-muted text-muted-foreground' },
  email_sent: { label: 'Đã gửi báo giá', color: 'bg-blue-100 text-blue-800' },
  booking_created: { label: 'Đã tạo hóa đơn', color: 'bg-green-100 text-green-800' },
  abandoned: { label: 'Bỏ giữa chừng', color: 'bg-orange-100 text-orange-800' },
};

export default function AdminChatbot() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterOutcome, setFilterOutcome] = useState<string>('all');
  const [selected, setSelected] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [adminMsg, setAdminMsg] = useState('');
  const [sending, setSending] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('chatbot_sessions')
      .select('*')
      .order('last_activity', { ascending: false })
      .limit(200);
    setSessions((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSessions(); }, []);

  // Realtime updates for sessions
  useEffect(() => {
    const ch = supabase
      .channel('admin-chatbot-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chatbot_sessions' }, () => {
        fetchSessions();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Load messages when session selected + realtime
  useEffect(() => {
    if (!selected) { setMessages([]); return; }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', selected.session_key)
        .order('created_at', { ascending: true });
      if (active) setMessages((data as any) || []);
    })();
    const ch = supabase
      .channel(`admin-chat-${selected.session_key}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `session_id=eq.${selected.session_key}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as any]);
      })
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [selected?.session_key]);

  const filtered = useMemo(() => {
    return sessions.filter(s => {
      if (filterOutcome !== 'all' && s.outcome !== filterOutcome) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.guest_name?.toLowerCase().includes(q) ||
        s.guest_phone?.includes(q) ||
        s.guest_email?.toLowerCase().includes(q) ||
        s.session_key.toLowerCase().includes(q) ||
        s.booking_code?.toLowerCase().includes(q)
      );
    });
  }, [sessions, search, filterOutcome]);

  const stats = useMemo(() => {
    const total = sessions.length;
    const voice = sessions.filter(s => s.used_voice).length;
    const emailed = sessions.filter(s => s.outcome === 'email_sent').length;
    const booked = sessions.filter(s => s.outcome === 'booking_created').length;
    const conversion = total > 0 ? Math.round(((emailed + booked) / total) * 100) : 0;
    return { total, voice, emailed, booked, conversion };
  }, [sessions]);

  const sendAdminMessage = async () => {
    if (!selected || !adminMsg.trim()) return;
    setSending(true);
    const { error } = await supabase.from('chat_messages').insert({
      session_id: selected.session_key,
      role: 'assistant',
      content: adminMsg.trim(),
      is_admin_message: true,
    });
    setSending(false);
    if (error) {
      toast({ title: 'Lỗi gửi', description: error.message, variant: 'destructive' });
      return;
    }
    setAdminMsg('');
    toast({ title: 'Đã gửi tin nhắn admin' });
  };

  const goToManualInvoice = (s: Session) => {
    // Stash extracted info into sessionStorage so AdminManualInvoice can prefill
    const info = s.extracted_info || {};
    sessionStorage.setItem('chat_to_invoice', JSON.stringify({
      guest_name: s.guest_name || info.name || '',
      guest_phone: s.guest_phone || info.phone || '',
      guest_email: s.guest_email || info.email || '',
      check_in: info.check_in || '',
      check_out: info.check_out || '',
      guests: info.guests || '',
      room_id: info.room_id || '',
      notes: `Tạo từ chat session ${s.session_key}`,
    }));
    toast({ title: 'Đã chuẩn bị thông tin', description: 'Mở tab "Tạo hóa đơn thủ công"' });
  };

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Tổng phiên</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Mic className="h-3 w-3" /> Dùng voice</div>
          <div className="text-2xl font-bold">{stats.voice}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Đã gửi mail</div>
          <div className="text-2xl font-bold text-blue-600">{stats.emailed}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="h-3 w-3" /> Đã đặt</div>
          <div className="text-2xl font-bold text-green-600">{stats.booked}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Conversion</div>
          <div className="text-2xl font-bold text-primary">{stats.conversion}%</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Tìm tên / SĐT / email / mã..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          value={filterOutcome}
          onChange={e => setFilterOutcome(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">Tất cả kết quả</option>
          <option value="no_action">Chưa hành động</option>
          <option value="email_sent">Đã gửi báo giá</option>
          <option value="booking_created">Đã tạo hóa đơn</option>
          <option value="abandoned">Bỏ giữa chừng</option>
        </select>
        <Button variant="outline" size="sm" onClick={fetchSessions}>
          <RefreshCw className="h-4 w-4 mr-1" /> Làm mới
        </Button>
      </div>

      {/* Sessions list */}
      <div className="space-y-2">
        {loading && <p className="text-center text-sm text-muted-foreground py-8">Đang tải...</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Chưa có phiên chat nào</p>
        )}
        {filtered.map(s => {
          const meta = outcomeMeta[s.outcome] || outcomeMeta.no_action;
          return (
            <Card key={s.id} className="p-4 hover:border-primary/50 transition cursor-pointer" onClick={() => setSelected(s)}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold truncate">
                      {s.guest_name || <span className="text-muted-foreground italic">Khách ẩn danh</span>}
                    </span>
                    {s.used_voice && <Badge variant="outline" className="gap-1"><Mic className="h-3 w-3" /> Voice</Badge>}
                    <Badge className={meta.color}>{meta.label}</Badge>
                    {s.device_type === 'mobile'
                      ? <Smartphone className="h-3 w-3 text-muted-foreground" />
                      : <Monitor className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                    {s.guest_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.guest_phone}</span>}
                    {s.guest_email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{s.guest_email}</span>}
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{s.message_count} tin</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(s.last_activity), { locale: vi, addSuffix: true })}</span>
                  </div>
                  {s.booking_code && (
                    <div className="text-xs mt-1 text-green-700">📄 {s.booking_code}</div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelected(s); }}>
                    Xem chat
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <User className="h-4 w-4" />
              {selected?.guest_name || 'Khách ẩn danh'}
              {selected?.used_voice && <Badge variant="outline" className="gap-1"><Mic className="h-3 w-3" /> Voice</Badge>}
              <Badge className={outcomeMeta[selected?.outcome || 'no_action'].color}>
                {outcomeMeta[selected?.outcome || 'no_action'].label}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <>
              {/* Info bar */}
              <div className="text-xs text-muted-foreground border-b pb-2 flex flex-wrap gap-x-3 gap-y-1">
                <span>Bắt đầu: {format(new Date(selected.started_at), 'dd/MM HH:mm', { locale: vi })}</span>
                {selected.guest_phone && <span>📞 {selected.guest_phone}</span>}
                {selected.guest_email && <span>✉️ {selected.guest_email}</span>}
                {selected.entry_page && <span>📍 {selected.entry_page}</span>}
                <span>💬 {selected.message_count} tin · 🎤 {selected.voice_messages_count}</span>
              </div>

              {/* Extracted info */}
              {selected.extracted_info && Object.keys(selected.extracted_info).length > 0 && (
                <div className="bg-muted/50 rounded p-2 text-xs">
                  <div className="font-semibold mb-1">Thông tin AI trích xuất:</div>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(selected.extracted_info, null, 2)}</pre>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-2 py-2 border rounded p-3 bg-background">
                {messages.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Chưa có tin nhắn</p>}
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-lg p-2 text-sm ${
                      m.role === 'user'
                        ? 'bg-muted'
                        : m.is_admin_message
                          ? 'bg-orange-500/10 border border-orange-500/30'
                          : 'bg-primary/10'
                    }`}>
                      <div className="text-[10px] font-semibold mb-0.5 opacity-70 flex items-center gap-1">
                        {m.role === 'user' ? '👤 Khách' : m.is_admin_message ? '🛡️ Admin' : '🤖 Chị Linh'}
                        {m.is_voice_input && <Mic className="h-2.5 w-2.5" />}
                        {m.is_voice_output && <span>🔊</span>}
                        <span className="ml-auto opacity-60">{format(new Date(m.created_at), 'HH:mm')}</span>
                      </div>
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Admin reply */}
              <div className="border-t pt-2 space-y-2">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Trả lời thay Chị Linh (admin)..."
                    value={adminMsg}
                    onChange={e => setAdminMsg(e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button onClick={sendAdminMessage} disabled={sending || !adminMsg.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => goToManualInvoice(selected)}>
                    <FileText className="h-4 w-4 mr-1" /> Tạo hóa đơn từ chat
                  </Button>
                  {selected.guest_email && (
                    <Badge variant="outline" className="gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" /> Đã có email</Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
