/**
 * AutoTranslateRoot — tự động dịch toàn bộ text node tiếng Việt trên trang
 * sang ngôn ngữ hiện tại bằng Lovable AI Gateway.
 *
 * Hoạt động:
 * - Khi user đổi ngôn ngữ (≠ vi) → quét DOM, gom text VI, gọi edge function
 *   `auto-translate` (đã có sẵn), thay text in-place.
 * - Lưu original VI vào WeakMap để khi đổi lại vi → khôi phục.
 * - MutationObserver bắt nội dung mới (lazy load, modal, query data...).
 * - Cache 24h trong localStorage qua hook đã có.
 * - Bỏ qua: <script>, <style>, <code>, input/textarea, area admin (.admin-area, [data-no-translate]).
 */
import { useEffect, useRef } from 'react';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

const LS_KEY = 'tdl_translations_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 60;
const MIN_LEN = 2;
const MAX_LEN = 600;

type CacheItem = { v: string; t: number };
type Cache = Record<string, CacheItem>;

function loadCache(): Cache {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function saveCache(c: Cache) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(c)); } catch { try { localStorage.removeItem(LS_KEY); } catch {} }
}
function getCached(lang: Language, text: string): string | null {
  const c = loadCache();
  const k = `${lang}::${text}`;
  const it = c[k];
  if (!it) return null;
  if (Date.now() - it.t > CACHE_TTL_MS) return null;
  return it.v;
}
function setCachedBatch(lang: Language, items: Record<string, string>) {
  const c = loadCache();
  const now = Date.now();
  for (const [vi, tr] of Object.entries(items)) {
    c[`${lang}::${vi}`] = { v: tr, t: now };
  }
  saveCache(c);
}

// Heuristic: chuỗi có vẻ là tiếng Việt / cần dịch
const VI_DIACRITIC_RE = /[ăâêôơưđàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵÀ-Ỹ]/i;
function looksTranslatable(s: string): boolean {
  const t = s.trim();
  if (t.length < MIN_LEN || t.length > MAX_LEN) return false;
  // Bỏ qua nếu chỉ là số/ký tự/giá tiền
  if (/^[\d\s.,:;!?%$₫¥€\-+/()*#@&|"'<>]+$/.test(t)) return false;
  if (/^\d[\d.,]*\s*(đ|vnd|usd|jpy|cny|\$|¥|€)?$/i.test(t)) return false;
  // Có dấu tiếng Việt → chắc chắn cần dịch
  if (VI_DIACRITIC_RE.test(t)) return true;
  // Không dấu nhưng có chữ cái → có thể là tiếng Việt không dấu hoặc tiếng Anh sẵn → vẫn gửi nếu có khoảng trắng (cụm từ)
  if (/[a-zA-Z]/.test(t) && /\s/.test(t) && t.length >= 4) return true;
  return false;
}

const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'KBD', 'SAMP',
  'INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'SVG', 'PATH',
]);

function shouldSkipElement(el: Element): boolean {
  if (SKIP_TAGS.has(el.tagName)) return true;
  if (el.hasAttribute('data-no-translate')) return true;
  if (el.classList?.contains('admin-area')) return true;
  // Bỏ admin dashboard
  if (el.closest?.('[data-admin]')) return true;
  return false;
}

type TextRecord = { node: Text; original: string };

function collectTextNodes(root: Node, originals: WeakMap<Text, string>): TextRecord[] {
  const out: TextRecord[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n: Node) {
      const t = n as Text;
      const parent = t.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      // Walk up to check skip
      let cur: Element | null = parent;
      while (cur) {
        if (shouldSkipElement(cur)) return NodeFilter.FILTER_REJECT;
        cur = cur.parentElement;
      }
      const original = originals.get(t) ?? t.nodeValue ?? '';
      if (!looksTranslatable(original)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let cur: Node | null;
  // eslint-disable-next-line no-cond-assign
  while ((cur = walker.nextNode())) {
    const t = cur as Text;
    const original = originals.get(t) ?? t.nodeValue ?? '';
    if (!originals.has(t)) originals.set(t, original);
    out.push({ node: t, original });
  }
  return out;
}

async function translateBatch(viTexts: string[], lang: Language): Promise<Record<string, string>> {
  if (viTexts.length === 0) return {};
  const texts: Record<string, string> = {};
  viTexts.forEach((t, i) => { texts[`k${i}`] = t; });
  const { data, error } = await supabase.functions.invoke('auto-translate', {
    body: { texts, targetLang: lang },
  });
  if (error) return {};
  const result: Record<string, string> = (data as any)?.translations || {};
  const map: Record<string, string> = {};
  viTexts.forEach((t, i) => {
    const tr = result[`k${i}`];
    if (typeof tr === 'string' && tr.trim()) map[t] = tr;
  });
  return map;
}

function emitTranslating(active: boolean) {
  window.dispatchEvent(new CustomEvent('tdl-translating', { detail: { active } }));
}

const AutoTranslateRoot = () => {
  const { language } = useLanguage();
  const originalsRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const langRef = useRef<Language>(language);
  const pendingRef = useRef<number | null>(null);
  const inflightRef = useRef(0);

  // Main effect: react to language change
  useEffect(() => {
    langRef.current = language;
    const originals = originalsRef.current;

    // Khôi phục khi quay lại vi
    if (language === 'vi') {
      // Walk DOM, restore originals
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      let cur: Node | null;
      // eslint-disable-next-line no-cond-assign
      while ((cur = walker.nextNode())) {
        const t = cur as Text;
        const orig = originals.get(t);
        if (orig != null && t.nodeValue !== orig) t.nodeValue = orig;
      }
      return;
    }

    let cancelled = false;

    const runOnce = async (root: Node = document.body) => {
      if (cancelled || langRef.current !== language) return;
      const records = collectTextNodes(root, originals);
      if (records.length === 0) return;

      // Áp cache trước
      const needFetch: string[] = [];
      const seen = new Set<string>();
      for (const r of records) {
        const cached = getCached(language, r.original);
        if (cached) {
          if (r.node.nodeValue !== cached) r.node.nodeValue = cached;
        } else if (!seen.has(r.original)) {
          seen.add(r.original);
          needFetch.push(r.original);
        }
      }

      if (needFetch.length === 0) return;

      inflightRef.current++;
      emitTranslating(true);
      try {
        // Batch nhỏ để tránh prompt quá lớn
        for (let i = 0; i < needFetch.length; i += BATCH_SIZE) {
          if (cancelled || langRef.current !== language) break;
          const chunk = needFetch.slice(i, i + BATCH_SIZE);
          const map = await translateBatch(chunk, language);
          if (cancelled || langRef.current !== language) break;
          setCachedBatch(language, map);
          // Áp vào DOM (re-walk vì DOM có thể thay đổi)
          const fresh = collectTextNodes(document.body, originals);
          for (const r of fresh) {
            const tr = map[r.original];
            if (tr && r.node.nodeValue !== tr) r.node.nodeValue = tr;
          }
        }
      } finally {
        inflightRef.current--;
        if (inflightRef.current <= 0) emitTranslating(false);
      }
    };

    // Initial run
    runOnce();

    // MutationObserver — debounce
    const scheduleScan = () => {
      if (pendingRef.current != null) return;
      pendingRef.current = window.setTimeout(() => {
        pendingRef.current = null;
        runOnce();
      }, 250);
    };

    const observer = new MutationObserver((mutations) => {
      // Bỏ qua nếu chỉ thay đổi text node mà ta vừa update
      let relevant = false;
      for (const m of mutations) {
        if (m.type === 'childList' && (m.addedNodes.length > 0)) { relevant = true; break; }
        if (m.type === 'characterData') {
          const t = m.target as Text;
          // nếu original chưa lưu → là content mới
          if (!originals.has(t)) { relevant = true; break; }
        }
      }
      if (relevant) scheduleScan();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      cancelled = true;
      observer.disconnect();
      if (pendingRef.current != null) {
        clearTimeout(pendingRef.current);
        pendingRef.current = null;
      }
    };
  }, [language]);

  return null;
};

export default AutoTranslateRoot;
