/**
 * useAutoTranslate — dịch text tiếng Việt sang ngôn ngữ hiện tại
 * - Cache trong localStorage (24h)
 * - Batch & debounce: gom nhiều text trên trang → 1 lần call edge function
 * - Khi đang dịch, hiện indicator "Đang dịch..." (qua event window)
 *
 * Cách dùng:
 *   const tr = useAutoTr(viText);  // string | undefined (undefined khi vi)
 *   <T>{viText}</T>                // component wrap
 */
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage, type Language } from '@/contexts/LanguageContext';

const LS_KEY = 'tdl_translations_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CacheItem = { v: string; t: number };
type Cache = Record<string, CacheItem>; // key = `${lang}::${hash}`

// ---------- Cache helpers ----------

function loadCache(): Cache {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}
function saveCache(cache: Cache) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cache));
  } catch {
    // quota exceeded → clear
    try { localStorage.removeItem(LS_KEY); } catch {}
  }
}
function getCached(lang: Language, viText: string): string | null {
  const cache = loadCache();
  const item = cache[`${lang}::${viText}`];
  if (!item) return null;
  if (Date.now() - item.t > CACHE_TTL_MS) return null;
  return item.v;
}
function setCached(lang: Language, viText: string, translated: string) {
  const cache = loadCache();
  cache[`${lang}::${viText}`] = { v: translated, t: Date.now() };
  saveCache(cache);
}

// ---------- Batch queue ----------

type PendingEntry = {
  viText: string;
  resolvers: ((value: string) => void)[];
};

const queues: Partial<Record<Language, Map<string, PendingEntry>>> = {};
const flushTimers: Partial<Record<Language, number>> = {};
let activeBatches = 0;

function emitTranslating(active: boolean) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('tdl-translating', { detail: { active } }));
}

async function flushQueue(lang: Language) {
  const q = queues[lang];
  if (!q || q.size === 0) return;

  // snapshot & reset
  const entries = Array.from(q.values());
  queues[lang] = new Map();
  flushTimers[lang] = undefined;

  const texts: Record<string, string> = {};
  entries.forEach((e, i) => {
    texts[`k${i}`] = e.viText;
  });

  activeBatches++;
  emitTranslating(true);

  try {
    const { data, error } = await supabase.functions.invoke('auto-translate', {
      body: { texts, targetLang: lang },
    });

    const result: Record<string, string> = (data as any)?.translations || {};
    entries.forEach((e, i) => {
      const translated = error ? e.viText : (result[`k${i}`] || e.viText);
      if (!error) setCached(lang, e.viText, translated);
      e.resolvers.forEach((r) => r(translated));
    });
  } catch (_err) {
    entries.forEach((e) => e.resolvers.forEach((r) => r(e.viText)));
  } finally {
    activeBatches--;
    if (activeBatches <= 0) emitTranslating(false);
  }
}

function enqueue(lang: Language, viText: string): Promise<string> {
  if (!queues[lang]) queues[lang] = new Map();
  const q = queues[lang]!;

  return new Promise<string>((resolve) => {
    const existing = q.get(viText);
    if (existing) {
      existing.resolvers.push(resolve);
    } else {
      q.set(viText, { viText, resolvers: [resolve] });
    }

    if (flushTimers[lang] == null) {
      flushTimers[lang] = window.setTimeout(() => flushQueue(lang), 120);
    }
  });
}

// ---------- Hook ----------

/**
 * useAutoTr — dịch 1 chuỗi tiếng Việt sang ngôn ngữ hiện tại.
 * Trả về chuỗi đã dịch (hoặc nguyên gốc nếu là vi / chưa dịch xong).
 */
export function useAutoTr(viText: string | null | undefined): string {
  const { language } = useLanguage();
  const text = (viText ?? '').toString();
  const [translated, setTranslated] = useState<string>(() => {
    if (!text || language === 'vi') return text;
    return getCached(language, text) ?? text;
  });
  const lastReqRef = useRef<{ lang: Language; text: string } | null>(null);

  useEffect(() => {
    if (!text) {
      setTranslated('');
      return;
    }
    if (language === 'vi') {
      setTranslated(text);
      return;
    }
    const cached = getCached(language, text);
    if (cached) {
      setTranslated(cached);
      return;
    }
    // Show VI as fallback while loading
    setTranslated(text);

    const req = { lang: language, text };
    lastReqRef.current = req;

    enqueue(language, text).then((result) => {
      // ignore if language changed mid-flight
      if (lastReqRef.current?.lang === req.lang && lastReqRef.current?.text === req.text) {
        setTranslated(result);
      }
    });
  }, [text, language]);

  return translated;
}

/**
 * Pre-warm: dịch nhiều chuỗi cùng lúc (ví dụ ở đầu trang).
 */
export function prefetchTranslations(viTexts: string[], lang: Language) {
  if (lang === 'vi') return;
  viTexts.forEach((t) => {
    if (t && !getCached(lang, t)) enqueue(lang, t);
  });
}
