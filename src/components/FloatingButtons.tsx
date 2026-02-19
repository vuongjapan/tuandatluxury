import { useState } from 'react';
import { MessageCircle, X, Send, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingButtons = () => {
  const { t } = useLanguage();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    // Placeholder AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('chatbot.welcome') },
      ]);
    }, 1000);
    setInput('');
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
          href="https://m.me/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-card shadow-card-hover flex items-center justify-center hover:shadow-gold transition-all duration-300 border border-border"
          title="Messenger"
        >
          <Facebook className="h-5 w-5 text-primary" />
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
              className="mb-3 w-80 bg-card rounded-xl shadow-card-hover border border-border overflow-hidden"
            >
              {/* Chat Header */}
              <div className="bg-gold-gradient p-3 flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-primary-foreground">
                  {t('chatbot.title')}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setChatOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <div className="h-64 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 && (
                  <div className="text-sm text-muted-foreground bg-secondary rounded-lg p-3">
                    {t('chatbot.welcome')}
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`text-sm rounded-lg p-3 ${msg.role === 'user' ? 'bg-primary/10 text-foreground ml-8' : 'bg-secondary text-foreground mr-8'}`}>
                    {msg.content}
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="border-t border-border p-3 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t('chatbot.placeholder')}
                  className="flex-1 text-sm bg-secondary rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                />
                <Button variant="gold" size="icon" className="h-9 w-9 shrink-0" onClick={handleSend}>
                  <Send className="h-4 w-4" />
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
