import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Volume2, RefreshCw, Loader2, Send, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hotel-chat`;

type Status = 'idle' | 'listening' | 'thinking' | 'speaking' | 'paused';

interface VoiceMsg {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  baseMessages: VoiceMsg[];
  onMessagesChange: (msgs: VoiceMsg[]) => void;
}

// Strip HTML/markdown/emoji + special blocks before TTS
function cleanForSpeech(t: string): string {
  return t
    .replace(/---BOOKING_SUMMARY---[\s\S]*?---END_BOOKING---/g, '')
    .replace(/---ROOM_GALLERY---[\s\S]*?---END_GALLERY---/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\*\*/g, '')
    .replace(/[#`*_~]/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Cap TTS length to avoid the "kéo dài lê thê" feel — take first 1-2 sentences, max ~280 chars
function shortenForSpeech(t: string): string {
  const clean = cleanForSpeech(t);
  if (clean.length <= 280) return clean;
  const sentences = clean.split(/(?<=[.!?])\s+/);
  let out = '';
  for (const s of sentences) {
    if ((out + ' ' + s).trim().length > 280) break;
    out = (out + ' ' + s).trim();
  }
  if (!out) out = clean.slice(0, 280);
  return out + '…';
}

// Remove duplicated trailing words (Web Speech API hay lặp "phòng phòng phòng")
function dedupeTranscript(t: string): string {
  const words = t.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (const w of words) {
    // skip if same as previous word (case-insensitive)
    if (out.length && out[out.length - 1].toLowerCase() === w.toLowerCase()) continue;
    // skip if last 2 words form a repeating pair
    if (out.length >= 2 && out[out.length - 2].toLowerCase() === w.toLowerCase() && out[out.length - 1].toLowerCase() === words[words.indexOf(w) - 1]?.toLowerCase()) continue;
    out.push(w);
  }
  return out.join(' ');
}

const VoiceChatModal = ({ open, onClose, sessionId, baseMessages, onMessagesChange }: Props) => {
  const { settings } = useSiteSettings();
  const [status, setStatus] = useState<Status>('idle');
  const statusRef = useRef<Status>('idle');
  const [interim, setInterim] = useState('');
  const [messages, setMessages] = useState<VoiceMsg[]>(baseMessages);
  const [supported, setSupported] = useState(true);
  const [permError, setPermError] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const silenceTimer = useRef<any>(null);
  const finalTranscript = useRef('');
  const isStoppingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const lastSentRef = useRef('');
  const lastResponseRef = useRef('');
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const lastFinalIndexRef = useRef(0); // track which result indices we've committed
  const pausedRef = useRef(false);

  const setStatusBoth = (s: Status) => {
    statusRef.current = s;
    setStatus(s);
  };

  // Sync to parent on changes
  useEffect(() => { onMessagesChange(messages); }, [messages]);

  // Check support
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR && 'speechSynthesis' in window);
  }, []);

  // Load Vietnamese voice
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((v) => v.lang === 'vi-VN' && /female|hoaimy|linh/i.test(v.name)) ||
        voices.find((v) => v.lang === 'vi-VN') ||
        voices.find((v) => v.lang.startsWith('vi')) ||
        null;
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  const hardStopRecognition = () => {
    isStoppingRef.current = true;
    if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null; }
    try { recognitionRef.current?.abort?.(); } catch {}
    try { recognitionRef.current?.stop?.(); } catch {}
    recognitionRef.current = null;
  };

  const speak = useCallback(async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      const clean = shortenForSpeech(text);
      if (!clean) return resolve();
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(clean);
        if (voiceRef.current) u.voice = voiceRef.current;
        u.lang = 'vi-VN';
        u.rate = 1.02;
        u.pitch = 1.05;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      } catch {
        resolve();
      }
    });
  }, []);

  const startListening = useCallback(() => {
    if (pausedRef.current) return;
    if (statusRef.current === 'thinking' || statusRef.current === 'speaking') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    // Always tear down any prior instance to avoid double-listeners (root cause of "kéo dài chữ")
    hardStopRecognition();

    const r = new SR();
    r.lang = 'vi-VN';
    r.continuous = false; // single utterance — prevents accumulating duplicates
    r.interimResults = true;
    r.maxAlternatives = 1;
    isStoppingRef.current = false;
    finalTranscript.current = '';
    lastFinalIndexRef.current = 0;

    r.onresult = (event: any) => {
      // Block any input while we're processing a previous response or speaking
      if (isProcessingRef.current || statusRef.current === 'speaking' || statusRef.current === 'thinking') return;

      let interimText = '';
      // Only process results we haven't seen before
      for (let i = lastFinalIndexRef.current; i < event.results.length; i++) {
        const res = event.results[i];
        const txt = (res[0].transcript || '').trim();
        if (!txt) continue;
        if (res.isFinal) {
          // Commit final once
          if (i >= lastFinalIndexRef.current) {
            finalTranscript.current = dedupeTranscript((finalTranscript.current + ' ' + txt).trim());
            lastFinalIndexRef.current = i + 1;
          }
        } else {
          interimText = txt; // overwrite — don't accumulate
        }
      }
      const display = dedupeTranscript((finalTranscript.current + ' ' + interimText).trim());
      setInterim(display);

      // Auto-send fallback after long silence (4s) — but user can press "Dừng & Gửi" anytime
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => {
        const toSend = finalTranscript.current.trim();
        if (toSend.length > 1 && !isProcessingRef.current) {
          isStoppingRef.current = true;
          try { r.stop(); } catch {}
          sendToAI(toSend);
        }
      }, 4000);
    };

    r.onerror = (e: any) => {
      if (e.error === 'not-allowed') setPermError('Vui lòng cho phép truy cập microphone trong trình duyệt');
      // 'no-speech' / 'aborted' → handled by onend
    };

    r.onend = () => {
      // Auto-restart only if still in listening mode and not paused/processing
      if (
        !isStoppingRef.current &&
        !pausedRef.current &&
        !isProcessingRef.current &&
        statusRef.current === 'listening'
      ) {
        setTimeout(() => {
          if (statusRef.current === 'listening' && !isProcessingRef.current && !pausedRef.current) {
            startListening();
          }
        }, 300);
      }
    };

    recognitionRef.current = r;
    try {
      r.start();
      setStatusBoth('listening');
    } catch {}
  }, []);

  const sendToAI = useCallback(async (transcript: string) => {
    const cleaned = dedupeTranscript(transcript.trim());
    if (!cleaned || cleaned.length < 2) {
      setStatusBoth('listening');
      startListening();
      return;
    }
    if (isProcessingRef.current) return;
    if (cleaned === lastSentRef.current) {
      setStatusBoth('listening');
      startListening();
      return;
    }
    isProcessingRef.current = true;
    lastSentRef.current = cleaned;
    finalTranscript.current = '';
    lastFinalIndexRef.current = 0;
    hardStopRecognition();

    setStatusBoth('thinking');
    const userMsg: VoiceMsg = { role: 'user', content: cleaned };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInterim('');

    let assistantContent = '';
    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMsgs.map((m) => ({ role: m.role, content: m.content })),
          session_id: sessionId,
          entry_page: window.location.pathname,
          device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          is_voice_input: true,
        }),
      });

      if (!resp.ok) throw new Error('AI lỗi');

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;
      setMessages((p) => [...p, { role: 'assistant', content: '' }]);

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const j = line.slice(6).trim();
          if (j === '[DONE]') { done = true; break; }
          try {
            const p = JSON.parse(j);
            const c = p.choices?.[0]?.delta?.content;
            if (c) {
              assistantContent += c;
              setMessages((prev) => {
                const n = [...prev];
                n[n.length - 1] = { role: 'assistant', content: assistantContent };
                return n;
              });
            }
          } catch {}
        }
      }

      lastResponseRef.current = assistantContent;
      setStatusBoth('speaking');
      // Mute the mic completely while speaking to avoid TTS feedback being recognized
      hardStopRecognition();
      await speak(assistantContent);
      isProcessingRef.current = false;
      if (!pausedRef.current) {
        setStatusBoth('listening');
        // small gap before re-enabling mic so TTS tail doesn't bleed in
        setTimeout(() => { if (!pausedRef.current) startListening(); }, 400);
      }
    } catch (err) {
      isProcessingRef.current = false;
      setMessages((p) => [...p, { role: 'assistant', content: '❌ Linh đang gặp sự cố, anh/chị thử lại nhé!' }]);
      if (!pausedRef.current) {
        setStatusBoth('listening');
        setTimeout(() => { if (!pausedRef.current) startListening(); }, 400);
      }
    }
  }, [messages, sessionId, speak, startListening]);

  // Open: greet + start
  useEffect(() => {
    if (!open || !supported) return;
    let cancelled = false;
    pausedRef.current = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        setPermError('Vui lòng cho phép truy cập microphone');
        return;
      }
      if (cancelled) return;

      // Greet only if no prior conversation
      if (messages.length === 0) {
        setStatusBoth('speaking');
        await speak('Dạ em chào anh chị! Em là Linh, lễ tân Tuấn Đạt Luxury. Anh chị cần em tư vấn gì ạ?');
      }
      if (!cancelled && !pausedRef.current) {
        setStatusBoth('listening');
        setTimeout(() => startListening(), 300);
      }
    })();

    return () => {
      cancelled = true;
      pausedRef.current = true;
      hardStopRecognition();
      window.speechSynthesis.cancel();
      setStatusBoth('idle');
      setInterim('');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, supported]);

  const togglePause = () => {
    if (pausedRef.current) {
      pausedRef.current = false;
      setStatusBoth('listening');
      startListening();
    } else {
      pausedRef.current = true;
      hardStopRecognition();
      window.speechSynthesis.cancel();
      setStatusBoth('paused');
    }
  };

  const repeatLast = async () => {
    if (!lastResponseRef.current) return;
    hardStopRecognition();
    setStatusBoth('speaking');
    await speak(lastResponseRef.current);
    if (!pausedRef.current) {
      setStatusBoth('listening');
      setTimeout(() => startListening(), 400);
    }
  };

  const statusText: Record<Status, { label: string; color: string }> = {
    idle: { label: 'Chuẩn bị...', color: 'text-muted-foreground' },
    listening: { label: '🔴 Đang nghe anh/chị nói...', color: 'text-red-500' },
    thinking: { label: '💭 Linh đang suy nghĩ...', color: 'text-amber-500' },
    speaking: { label: '🔊 Linh đang trả lời...', color: 'text-green-600' },
    paused: { label: '⏸ Đã tạm dừng', color: 'text-muted-foreground' },
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gold-gradient p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.chatbot_avatar_url ? (
                  <img src={settings.chatbot_avatar_url} alt="Linh" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/40" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">👩</div>
                )}
                <div>
                  <p className="font-display font-semibold text-primary-foreground">Lễ tân Linh</p>
                  <p className="text-xs text-primary-foreground/80">Trò chuyện bằng giọng nói</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {!supported && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
                  Trình duyệt của bạn chưa hỗ trợ giọng nói. Vui lòng dùng Chrome trên desktop hoặc Android.
                </div>
              )}
              {permError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-900">
                  ⚠ {permError}
                </div>
              )}

              {/* Avatar pulse */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className={`w-28 h-28 rounded-full bg-gold-gradient flex items-center justify-center text-5xl shadow-gold ${
                    status === 'listening' ? 'animate-pulse' : ''
                  }`}>
                    {status === 'speaking' ? <Volume2 className="text-white w-12 h-12" /> :
                     status === 'thinking' ? <Loader2 className="text-white w-12 h-12 animate-spin" /> :
                     status === 'listening' ? <Mic className="text-white w-12 h-12" /> :
                     <MicOff className="text-white w-12 h-12" />}
                  </div>
                  {status === 'listening' && (
                    <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
                  )}
                </div>
              </div>

              {/* Status */}
              <p className={`text-center text-sm font-medium ${statusText[status].color}`}>
                {statusText[status].label}
              </p>

              {/* Interim transcript */}
              {interim && status === 'listening' && (
                <div className="bg-secondary/60 rounded-lg p-3 text-sm text-foreground italic text-center">
                  "{interim}"
                </div>
              )}

              {/* Last 3 messages */}
              {messages.length > 0 && (
                <div className="bg-secondary/40 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {messages.slice(-3).map((m, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-semibold">{m.role === 'user' ? '👤 Bạn:' : '🤖 Linh:'}</span>{' '}
                      <span className="text-muted-foreground">{cleanForSpeech(m.content).slice(0, 120)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="border-t border-border p-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={togglePause} disabled={!supported}>
                {status === 'paused' ? <><Mic className="h-4 w-4 mr-1" /> Tiếp tục</> : <><MicOff className="h-4 w-4 mr-1" /> Tạm dừng</>}
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={repeatLast} disabled={!lastResponseRef.current}>
                <RefreshCw className="h-4 w-4 mr-1" /> Nói lại
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VoiceChatModal;
