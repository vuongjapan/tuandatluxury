/**
 * Indicator nhỏ ở góc dưới-phải khi đang dịch nội dung sang ngôn ngữ khác.
 * Lắng nghe event 'tdl-translating' do useAutoTranslate phát.
 */
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const LABELS: Record<string, string> = {
  vi: 'Đang dịch...',
  en: 'Translating...',
  ja: '翻訳中...',
  zh: '翻译中...',
};

const TranslatingIndicator = () => {
  const { language } = useLanguage();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setActive(!!detail?.active);
    };
    window.addEventListener('tdl-translating', handler);
    return () => window.removeEventListener('tdl-translating', handler);
  }, []);

  if (!active || language === 'vi') return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[200] flex items-center gap-2 rounded-full bg-black/80 px-4 py-2 text-sm text-white shadow-lg backdrop-blur"
    >
      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      <span>{LABELS[language] || LABELS.en}</span>
    </div>
  );
};

export default TranslatingIndicator;
