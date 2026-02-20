import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Facebook, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const SESSION_KEY = 'tdl_chat_session';

const getOrCreateSession = () => {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = 'sess-' + Math.random().toString(36).slice(2);
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hotel-chat`;

const FloatingButtons = () => {
  const { t } = useLanguage();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(getOrCreateSession());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';
    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          session_id: sessionId.current,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Lỗi kết nối');
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamDone = false;

      // Add empty assistant message placeholder
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = parsed.choices?.[0]?.delta?.content;
            if (chunk) {
              assistantContent += chunk;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${err.message || 'Có lỗi xảy ra, vui lòng thử lại!'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Left side - Quick actions */}
      <div className="fixed left-4 bottom-4 z-40 flex flex-col gap-2">
        <a
          href="tel:0986617939"
          className="w-12 h-12 rounded-full bg-card shadow-card-hover flex items-center justify-center hover:shadow-gold transition-all duration-300 border border-border"
          title="Hotline"
        >
          <span className="text-lg">📞</span>
        </a>
        <a
          href="https://zalo.me/0986617939"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-card shadow-card-hover flex items-center justify-center hover:shadow-gold transition-all duration-300 border border-border"
          title="Zalo"
        >
          <span className="text-lg">💬</span>
        </a>
        <a
          href="https://m.me/tuan.dat.luxury"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-[#0084FF] shadow-card-hover flex items-center justify-center hover:brightness-110 transition-all duration-300"
          title="Messenger"
        >
          <Facebook className="h-5 w-5 text-white" />
        </a>
      </div>

      {/* Right side - AI Chatbot */}
      <div className="fixed right-4 bottom-4 z-40">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="mb-3 w-80 sm:w-96 bg-card rounded-xl shadow-card-hover border border-border overflow-hidden"
            >
              {/* Chat Header */}
              <div className="bg-gold-gradient p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-sm">👩</div>
                  <div>
                    <p className="font-display text-sm font-semibold text-primary-foreground">Lan Anh - Lễ tân AI</p>
                    <p className="text-xs text-primary-foreground/70">Tuấn Đạt Luxury · Online</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setChatOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <div className="h-72 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 && (
                  <div className="text-sm text-muted-foreground bg-secondary rounded-lg p-3">
                    👋 Xin chào! Em là Lan Anh, lễ tân AI của Tuấn Đạt Luxury. Em có thể giúp anh/chị tư vấn phòng, thông tin thời tiết biển Sầm Sơn, phong thủy, hoặc đặt phòng. Anh/chị cần hỗ trợ gì ạ?
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`text-sm rounded-lg p-3 ${msg.role === 'user' ? 'bg-primary/10 text-foreground ml-8' : 'bg-secondary text-foreground mr-8'}`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none text-foreground [&_p]:mb-1 [&_ul]:mb-1 [&_li]:mb-0.5">
                        <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="bg-secondary rounded-lg p-3 mr-8 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Lan Anh đang trả lời...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestions */}
              {messages.length === 0 && (
                <div className="px-3 pb-2 flex gap-1 flex-wrap">
                  {['🌊 Thời tiết biển', '🛏️ Xem phòng', '🧭 Phong thủy', '💰 Bảng giá'].map(s => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); }}
                      className="text-xs bg-secondary hover:bg-primary/10 border border-border rounded-full px-2 py-1 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="border-t border-border p-3 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Nhắn tin với Lan Anh..."
                  className="flex-1 text-sm bg-secondary rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  disabled={isLoading}
                />
                <Button variant="gold" size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={isLoading || !input.trim()}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="w-14 h-14 rounded-full bg-gold-gradient shadow-gold flex items-center justify-center hover:brightness-110 transition-all duration-300"
        >
          {chatOpen ? (
            <X className="h-6 w-6 text-primary-foreground" />
          ) : (
            <MessageCircle className="h-6 w-6 text-primary-foreground" />
          )}
        </button>
      </div>
    </>
  );
};

export default FloatingButtons;
