import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Facebook, Loader2, Trash2, CalendarDays, Users, Moon, CreditCard, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useNavigate } from 'react-router-dom';

const SESSION_KEY = 'tdl_chat_session';
const MESSAGES_KEY = 'tdl_chat_messages';

const getOrCreateSession = () => {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = 'sess-' + Math.random().toString(36).slice(2) + '-' + Date.now();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

const loadCachedMessages = (): { role: string; content: string }[] => {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hotel-chat`;

interface BookingSummary {
  room_id: string;
  room_name: string;
  checkin: string;
  checkout: string;
  guests: string;
  nights: string;
  price_per_night: string;
  total_price: string;
}

interface RoomGallery {
  title: string;
  images: string[];
  room_id: string;
}

function parseSpecialBlocks(content: string): { text: string; booking: BookingSummary | null; galleries: RoomGallery[] } {
  let text = content;
  
  // Parse booking
  const bookingRegex = /---BOOKING_SUMMARY---([\s\S]*?)---END_BOOKING---/g;
  let booking: BookingSummary | null = null;
  const bookingMatch = content.match(bookingRegex);
  if (bookingMatch) {
    text = text.replace(bookingRegex, '').trim();
    const inner = bookingMatch[0].replace(/---BOOKING_SUMMARY---|---END_BOOKING---/g, '').trim();
    const fields: Record<string, string> = {};
    inner.split('\n').forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) fields[line.slice(0, colonIdx).trim()] = line.slice(colonIdx + 1).trim();
    });
    if (fields.room_id) booking = fields as unknown as BookingSummary;
  }

  // Parse galleries
  const galleryRegex = /---ROOM_GALLERY---([\s\S]*?)---END_GALLERY---/g;
  const galleries: RoomGallery[] = [];
  let gMatch;
  while ((gMatch = galleryRegex.exec(content)) !== null) {
    text = text.replace(gMatch[0], '').trim();
    const fields: Record<string, string> = {};
    gMatch[1].trim().split('\n').forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) fields[line.slice(0, colonIdx).trim()] = line.slice(colonIdx + 1).trim();
    });
    if (fields.images) {
      galleries.push({
        title: fields.title || 'Ảnh khách sạn',
        images: fields.images.split(',').map(u => u.trim()).filter(Boolean),
        room_id: fields.room_id || '',
      });
    }
  }

  return { text, booking, galleries };
}

function formatVND(n: string | number) {
  return Number(n).toLocaleString('vi-VN') + 'đ';
}

function formatDateVN(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

const ImageGalleryCard = ({ gallery, onViewRoom }: { gallery: RoomGallery; onViewRoom?: (id: string) => void }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const imgs = gallery.images;

  if (!imgs.length) return null;

  return (
    <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 overflow-hidden">
      <div className="relative">
        <img
          src={imgs[currentIdx]}
          alt={gallery.title}
          className="w-full h-36 object-cover cursor-pointer"
          onClick={() => setFullscreen(true)}
          loading="lazy"
        />
        {imgs.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIdx(i => (i - 1 + imgs.length) % imgs.length)}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <button
              onClick={() => setCurrentIdx(i => (i + 1) % imgs.length)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
            <div className="absolute bottom-1 right-1 bg-background/80 text-[10px] px-1.5 py-0.5 rounded text-foreground">
              {currentIdx + 1}/{imgs.length}
            </div>
          </>
        )}
      </div>
      <div className="p-2 flex items-center justify-between">
        <p className="text-xs font-medium truncate">{gallery.title}</p>
        {gallery.room_id && onViewRoom && (
          <button
            onClick={() => onViewRoom(gallery.room_id)}
            className="text-[10px] text-primary flex items-center gap-0.5 hover:underline shrink-0"
          >
            Xem chi tiết <ExternalLink className="h-2.5 w-2.5" />
          </button>
        )}
      </div>

      {/* Fullscreen lightbox */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 flex items-center justify-center"
            onClick={() => setFullscreen(false)}
          >
            <img src={imgs[currentIdx]} alt="" className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg" />
            <button onClick={() => setFullscreen(false)} className="absolute top-4 right-4">
              <X className="h-6 w-6 text-foreground" />
            </button>
            {imgs.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentIdx(i => (i - 1 + imgs.length) % imgs.length); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card flex items-center justify-center"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentIdx(i => (i + 1) % imgs.length); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card flex items-center justify-center"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FloatingButtons = () => {
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(loadCachedMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(getOrCreateSession());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Persist messages to localStorage (keep last 50)
    if (messages.length > 0) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages.slice(-50)));
    }
  }, [messages]);

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem(MESSAGES_KEY);
    localStorage.removeItem(SESSION_KEY);
    sessionId.current = getOrCreateSession();
  };

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
      {/* Left side - Quick contact actions */}
      <div className="fixed left-3 sm:left-4 bottom-20 sm:bottom-4 z-40 flex flex-col gap-2.5">
        {/* Phone — pulsing red urgent */}
        <a
          href="tel:0384418811"
          className="relative w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
          title="Gọi ngay 0384418811"
          aria-label="Gọi điện"
        >
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40" />
          <svg viewBox="0 0 24 24" className="relative w-6 h-6 text-white" fill="currentColor">
            <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1 1 0 0 0-1.02.24l-2.2 2.2a15.05 15.05 0 0 1-6.59-6.59l2.2-2.2a1 1 0 0 0 .25-1.02A11.36 11.36 0 0 1 8.5 4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1c0 9.39 7.61 17 17 17a1 1 0 0 0 1-1v-3.5a1 1 0 0 0-1-1z"/>
          </svg>
        </a>

        {/* Zalo — official blue */}
        <a
          href="https://zalo.me/0384418811"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
          style={{ background: '#0068FF' }}
          title="Chat Zalo"
          aria-label="Zalo"
        >
          <span className="text-white font-bold text-[13px] tracking-tight">Zalo</span>
        </a>

        {/* Messenger — official gradient, opens m.me directly */}
        <a
          href="https://m.me/KhachSanTuanDatLuxuryFLC"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
          style={{ background: 'linear-gradient(135deg, #00B2FF, #006AFF)' }}
          title="Messenger"
          aria-label="Messenger"
        >
          <svg viewBox="0 0 36 36" className="w-7 h-7" fill="white">
            <path d="M18 2C9.16 2 2 8.65 2 16.85c0 4.67 2.32 8.84 5.95 11.56V34l5.43-2.98c1.45.4 2.99.62 4.62.62 8.84 0 16-6.65 16-14.85S26.84 2 18 2zm1.59 19.99-4.07-4.34-7.95 4.34L16.32 13l4.17 4.34L28.34 13l-8.75 8.99z"/>
          </svg>
        </a>

        {/* Facebook page */}
        <a
          href="https://www.facebook.com/KhachSanTuanDatLuxuryFLC"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
          style={{ background: '#1877F2' }}
          title="Facebook"
          aria-label="Facebook"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
            <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.27h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z"/>
          </svg>
        </a>
      </div>

      {/* Right side - AI Chatbot */}
      <div className="fixed right-4 bottom-20 sm:bottom-4 z-40">
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
                  {settings.chatbot_avatar_url ? (
                    <img src={settings.chatbot_avatar_url} alt="Linh" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-sm">👩</div>
                  )}
                  <div>
                    <p className="font-display text-sm font-semibold text-primary-foreground">Lễ tân Linh</p>
                    <p className="text-xs text-primary-foreground/70">Tuấn Đạt Luxury · Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/10" onClick={handleClearChat} title="Xóa lịch sử chat">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setChatOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="h-72 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 && (
                  <div className="text-sm text-muted-foreground bg-secondary rounded-lg p-3">
                    👋 Xin chào anh/chị! Cảm ơn anh/chị đã quan tâm đến Khách sạn Tuấn Đạt Luxury Sầm Sơn. Anh/chị cho em xin ngày nhận phòng và số lượng khách, em tư vấn phòng phù hợp nhất ạ!
                  </div>
                )}
                {messages.map((msg, i) => {
                  if (msg.role === 'user') {
                    return (
                      <div key={i} className="text-sm rounded-lg p-3 bg-primary/10 text-foreground ml-8">
                        {msg.content}
                      </div>
                    );
                  }

                  const { text, booking, galleries } = parseSpecialBlocks(msg.content || '...');

                  return (
                    <div key={i} className="text-sm rounded-lg p-3 bg-secondary text-foreground mr-8">
                      {text && (
                        <div className="prose prose-sm max-w-none text-foreground [&_p]:mb-1 [&_ul]:mb-1 [&_li]:mb-0.5">
                          <ReactMarkdown>{text}</ReactMarkdown>
                        </div>
                      )}
                      {galleries.map((g, gi) => (
                        <ImageGalleryCard
                          key={gi}
                          gallery={g}
                          onViewRoom={g.room_id ? (id) => {
                            setChatOpen(false);
                            navigate(`/rooms/${id}`);
                          } : undefined}
                        />
                      ))}
                      {booking && (
                        <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                          <p className="font-semibold text-primary text-sm">📋 Tóm tắt đặt phòng</p>
                          <div className="grid grid-cols-2 gap-1.5 text-xs">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <CalendarDays className="h-3 w-3" /> Nhận phòng
                            </div>
                            <div className="font-medium">{formatDateVN(booking.checkin)}</div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <CalendarDays className="h-3 w-3" /> Trả phòng
                            </div>
                            <div className="font-medium">{formatDateVN(booking.checkout)}</div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Moon className="h-3 w-3" /> Số đêm
                            </div>
                            <div className="font-medium">{booking.nights} đêm</div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-3 w-3" /> Số khách
                            </div>
                            <div className="font-medium">{booking.guests} người</div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <CreditCard className="h-3 w-3" /> Tổng tiền
                            </div>
                            <div className="font-semibold text-primary">{formatVND(booking.total_price)}</div>
                          </div>
                          <Button
                            variant="gold"
                            size="sm"
                            className="w-full mt-1 text-xs"
                            onClick={() => {
                              setChatOpen(false);
                              navigate(`/booking?room=${booking.room_id}&checkin=${booking.checkin}&checkout=${booking.checkout}&guests=${booking.guests}`);
                            }}
                          >
                            🏨 Đặt phòng {booking.room_name} ngay
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="bg-secondary rounded-lg p-3 mr-8 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Linh đang trả lời...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>


              {/* Input */}
              <div className="border-t border-border p-3 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Nhắn tin với Linh..."
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
